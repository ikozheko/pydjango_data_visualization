import json

from django.shortcuts import get_object_or_404, render, redirect
from django.http import JsonResponse, HttpResponseRedirect
from django.core.exceptions import PermissionDenied
from django.core import serializers
from django.core.paginator import Paginator
from django.db.models import Q
from django.contrib.auth import authenticate, login, logout

from .models import Execution

def index(request):
    return render(request, 'budget/index.html')

def edit_execution(request, execution_id):
    if not request.user.is_authenticated:
        raise PermissionDenied

    execution = get_object_or_404(Execution, pk=execution_id)

    if request.method == 'POST':
        purpose = float(request.POST.get('purpose', execution.purpose))
        cash = float(request.POST.get('cash', execution.cash))
        execution.cash = cash
        execution.purpose = purpose
        execution.save()

    response_data = json.loads(serializers.serialize('json', [ execution, ], indent=2, use_natural_foreign_keys=True, use_natural_primary_keys=True))
    return JsonResponse(response_data[0])

def budget_execution(request):
    draw = int(request.GET.get('draw', 1))
    start = int(request.GET.get('start', 0))
    length = int(request.GET.get('length', 10))
    search = str(request.GET.get('search[value]', ''))
    order_column = request.GET.get('order[0][column]', '2')
    order_dir = request.GET.get('order[0][dir]', 'asc')
    column_name = request.GET.get('columns[' + order_column + '][name]', '')

    objects = Execution.objects

    records_total = objects.count()

    objects_filtered = objects.all()

    if (len(column_name) > 0):
        desc = ''
        if (order_dir == 'desc'):
            desc = '-'
        objects_filtered = objects_filtered.order_by(desc + column_name)

    if (len(search) > 3):
        objects_filtered = objects_filtered.filter(Q(year__icontains=search) | Q(indicator__kbk__icontains=search) | Q(indicator__name__icontains=search))

    records_filtered = objects_filtered.count()

    paginator = Paginator(objects_filtered, length)
    page = start / length + 1
    if (page <= 0):
        page = 1
    object_list = paginator.page(page)

    data = json.loads(serializers.serialize('json', object_list, indent=2, use_natural_foreign_keys=True, use_natural_primary_keys=True))

    response_data = {}
    response_data['column_name'] = column_name
    response_data['draw'] = draw
    response_data['recordsTotal'] = records_total
    response_data['recordsFiltered'] = records_filtered
    response_data['data'] = data

    return JsonResponse(response_data)

def login_view(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
    return redirect('budget:index')

def logout_view(request):
    logout(request)
    return redirect('budget:index')
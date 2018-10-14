from django.urls import path

from . import views

app_name = 'budget'
urlpatterns = [
    path('', views.index, name='index'),
    path('edit_execution/<int:execution_id>/', views.edit_execution, name='edit_execution'),
    path('budget_execution/', views.budget_execution, name='budget_execution'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]
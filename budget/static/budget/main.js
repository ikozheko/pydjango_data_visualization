function prepare_charts_data(data)
{
    data.sort(function(a, b) {
        if (a.fields.year < b.fields.year)
            return -1;
        if (a.fields.year > b.fields.year)
            return 1;
        return 0;
    });

    var x_axis_data = []
    var purpose_data = []
    var cash_data = []

    for (var i = 0; i < data.length; i++) {
        x_axis_data.push(data[i].fields.year)
        purpose_data.push(data[i].fields.purpose)
        cash_data.push(data[i].fields.cash)
    }

    return {
        x_axis_data: x_axis_data,
        purpose_data: purpose_data,
        cash_data: cash_data
    }
}

function reinit_primary_chart(instance, x_axis_data, purpose_data, cash_data)
{
    var option = {
        title: {
        //    text: 'График исполнения по статьям КБК'
        },
        tooltip: {},
        legend: {
            data:['Назначение', 'Исполнение']
        },
        grid: {
            left: 100
        },
        xAxis: {
            data: x_axis_data
        },
        yAxis: {},
        series: [
            {
                name: 'Назначение',
                color: '#5cb85c',
                type: 'bar',
                data: purpose_data
            },
            {
                name: 'Исполнение',
                color: '#d9534f',
                type: 'bar',
                data: cash_data
            }
        ]
    };
    instance.setOption(option)
}

function reinit_secondary_chart(instance, x_axis_data, purpose_data, cash_data)
{
    var colors = ['#5cb85c', '#d9534f'];

    option = {
        color: colors,

        tooltip: {
            trigger: 'none',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {},
        grid: {
            top: 70,
            bottom: 50,
            left: 100
        },
        xAxis: [
            {
                type: 'category',
                axisTick: {
                    alignWithLabel: true
                },
                axisLine: {
                    onZero: false,
                    lineStyle: {
                        color: colors[1]
                    }
                },
                axisPointer: {
                    label: {
                        formatter: function (params) {
                            return params.value
                                + (params.seriesData.length ? '：' + params.seriesData[0].data : '');
                        }
                    }
                },
                data: x_axis_data
            },
            {
                type: 'category',
                axisTick: {
                    alignWithLabel: true
                },
                axisLine: {
                    onZero: false,
                    lineStyle: {
                        color: colors[0]
                    }
                },
                axisPointer: {
                    label: {
                        formatter: function (params) {
                            return params.value + (params.seriesData.length ? '：' + params.seriesData[0].data : '');
                        }
                    }
                },
                data: x_axis_data
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name:'Назначение',
                type:'line',
                xAxisIndex: 1,
                smooth: true,
                data: purpose_data
            },
            {
                name:'Исполнение',
                type:'line',
                smooth: true,
                data: cash_data
            }
        ]
    };
    instance.setOption(option)
}

$(function () {
    var execution_table = $('#budgetExecution').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.19/i18n/Russian.json'
        },
        serverSide: true,
        ajax: '/budget/budget_execution/',
        order: [[2, 'asc']],
        columns: [
            { data: 'pk', className: 'text-nowrap', orderable: false, searchable: false, render: function (data, type, row, meta) {
                return is_authenticated ? '<a class="js-edit-execution" href="#" data-id="' + data + '"><i class="fa fa-pencil-alt"></i></a>' : ''
            } },
            { data: 'fields.year', name: 'year',  className: 'text-nowrap' },
            { data: 'fields.indicator.1', name: 'indicator__kbk', className: 'text-nowrap', render: function (data, type, row, meta) {
                return '<a class="js-render-charts" data-kbk="' + data + '" href="javascript:void(0)">' + data + '</a>'
            } },
            { data: 'fields.indicator.2', name: 'indicator__name' },
            { data: 'fields.purpose', name: 'purpose', className: 'text-right text-nowrap', render: $.fn.dataTable.render.number('&nbsp;', ',', 2, '', '&nbsp;₽') },
            { data: 'fields.cash', name: 'cash', className: 'text-right text-nowrap', render: $.fn.dataTable.render.number('&nbsp;', ',', 2, '', '&nbsp;₽') },
        ]
    });

    var primary_chart = echarts.init($('#primary_chart')[0]);
    var secondary_chart = echarts.init($('#secondary_chart')[0]);

    $(document).on('click', '.js-render-charts', function () {
        var kbk = $(this).data('kbk')
        execution_table.search(kbk).draw()
        return false
    });

    execution_table.on('xhr', function() {
        var json = execution_table.ajax.json()
        var arr = json.data

        if (arr.length > 3) {
            $(".js-charts").hide()
            $(".js-charts-warning").show()
            return false
        }

        var data = prepare_charts_data(arr)
        $(".js-charts").show()
        $(".js-charts-warning").hide()
        reinit_primary_chart(primary_chart, data.x_axis_data, data.purpose_data, data.cash_data)
        reinit_secondary_chart(secondary_chart, data.x_axis_data, data.purpose_data, data.cash_data)
    });

    $(document).on('click', '.js-edit-execution', function () {
        if (!is_authenticated) return false
        var id = $(this).data('id')
        $.get('/budget/edit_execution/' + id + '/', function (execution) {
            $('.js-execution-id').val(execution.pk)
            $('.js-execution-year').text(execution.fields.year)
            $('.js-execution-kbk').text(execution.fields.indicator[1])
            $('.js-execution-indicator').text(execution.fields.indicator[2])
            $('.js-execution-purpose').val(execution.fields.purpose.toFixed(2))
            $('.js-execution-cash').val(execution.fields.cash.toFixed(2))
            $('#editExecution').modal('show')
        }, 'json')
        return false
    });

    $(document).on('click', '.js-save-execution', function () {
        if (!is_authenticated) return false
        var id = $('.js-execution-id').val()
        var purpose = $('.js-execution-purpose').val()
        var cash = $('.js-execution-cash').val()
        var csrf = $('[name=csrfmiddlewaretoken]').val()
        var data = { purpose: purpose, cash: cash, csrfmiddlewaretoken: csrf }
        $.post('/budget/edit_execution/' + id + '/', data, function (execution) {

            $('#editExecution').modal('hide')
            execution_table.ajax.reload(null, false)
        }, 'json')
    });

    $('.modal').on('shown.bs.modal', function () {
        $(this).find(':input:not(button):visible:first').focus()
    });

});
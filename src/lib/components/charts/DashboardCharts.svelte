<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    // Update interfaces to match your Go backend structure
    export let appointments: Array<{
        id?: number;
        date: string | Date;
        doctor_name?: string;
        status?: string;
        provider_name?: string; // Add for home care visits
        visit_date?: string;    // Add for home care visits
    }> = [];

    export let payments: Array<{
        id?: number;
        amount: number;
        date: string | Date;
        transaction_date?: string; // Add for transactions
        status?: string;
    }> = [];

    // Process data for charts
    $: appointmentsByDay = {
        labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        data: new Array(7).fill(0)
    };

    $: {
        // Group appointments by day
        appointments.forEach(apt => {
            const date = new Date(apt.date);
            const dayIndex = date.getDay();
            appointmentsByDay.data[dayIndex]++;
        });
    }

    $: revenueByMonth = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        data: new Array(12).fill(0)
    };

    $: {
        // Group payments by month
        payments.forEach(payment => {
            const date = new Date(payment.date);
            const monthIndex = date.getMonth();
            revenueByMonth.data[monthIndex] += Number(payment.amount) || 0;
        });
    }

    let charts: { [key: string]: Chart } = {};

    onMount(() => {
        // Initialize Revenue Chart
        const revenueCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
        if (revenueCtx) {
            charts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: revenueByMonth.labels,
                    datasets: [{
                        label: 'Monthly Revenue',
                        data: revenueByMonth.data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            callbacks: {
                                label: (context) => `Revenue: $${context.raw}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }

        // Initialize Appointments Chart
        const appointmentsCtx = document.getElementById('appointmentsChart') as HTMLCanvasElement;
        if (appointmentsCtx) {
            charts.appointments = new Chart(appointmentsCtx, {
                type: 'bar',
                data: {
                    labels: appointmentsByDay.labels,
                    datasets: [{
                        label: 'Appointments by Day',
                        data: appointmentsByDay.data,
                        backgroundColor: 'rgba(139, 92, 246, 0.5)',
                        borderColor: 'rgb(139, 92, 246)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                color: 'rgba(255, 255, 255, 0.7)',
                                stepSize: 1
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }
    });

    // Update charts when data changes
    $: if (charts.revenue && charts.appointments) {
        charts.revenue.data.datasets[0].data = revenueByMonth.data;
        charts.revenue.update('none');
        
        charts.appointments.data.datasets[0].data = appointmentsByDay.data;
        charts.appointments.update('none');
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
    <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h3 class="text-lg font-medium text-white mb-4">Revenue Trends</h3>
        <div class="h-[300px]">
            <canvas id="revenueChart"></canvas>
        </div>
    </div>
    <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h3 class="text-lg font-medium text-white mb-4">Appointments by Day</h3>
        <div class="h-[300px]">
            <canvas id="appointmentsChart"></canvas>
        </div>
    </div>
</div>

<style>
    canvas {
        @apply w-full h-full;
    }
</style>
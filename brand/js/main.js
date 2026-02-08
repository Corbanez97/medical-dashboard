// State Management
const state = {
    currentSection: 'concept',
    colors: {
        primary: '#B8860B',
        secondary: '#1A1A1A',
        bg: '#FAFAFA'
    }
};

// Navigation Function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navHeight = document.getElementById('navbar').offsetHeight;
        const targetPosition = section.offsetTop - navHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Color Copy Function
function copyToClipboard(hex, msgId) {
    navigator.clipboard.writeText(hex).then(() => {
        const msgEl = document.getElementById(msgId);
        const originalText = msgEl.innerText;
        msgEl.innerText = "Copiado!";
        msgEl.classList.remove('opacity-0');
        setTimeout(() => {
            msgEl.innerText = originalText;
            msgEl.classList.add('opacity-0');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Font Preview Function
function updateFontPreview() {
    const input = document.getElementById('fontTesterInput');
    const heading = document.getElementById('previewHeading');
    const body = document.getElementById('previewBody');

    if (input.value.trim() !== "") {
        heading.innerText = input.value;
        body.innerText = input.value + " - Exemplo de visualização.";
    } else {
        heading.innerText = "Dr. Tatsch Nutrologia";
        body.innerText = "A busca pelo corpo ideal deve estar alinhada à saúde plena. Agende sua consulta.";
    }
}

// Chart Initialization
document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    Chart.defaults.font.family = "'Montserrat', sans-serif";
    Chart.defaults.color = '#6B7280';

    // Fix: Override default locale behavior to prevent RangeError
    // We define explicit callback functions for ticks.

    // 1. Archetype Radar Chart
    const ctxArchetypeEl = document.getElementById('archetypeChart');
    if (ctxArchetypeEl) {
        const ctxArchetype = ctxArchetypeEl.getContext('2d');
        new Chart(ctxArchetype, {
            type: 'radar',
            data: {
                labels: ['Governante', 'Sábio', 'Cuidador', 'Mago', 'Explorador'],
                datasets: [{
                    label: 'Personalidade',
                    data: [35, 35, 20, 15, 5],
                    backgroundColor: 'rgba(184, 134, 11, 0.2)', // #B8860B
                    borderColor: '#B8860B',
                    pointBackgroundColor: '#1A1A1A',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#B8860B'
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0,0,0,0.05)' },
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        pointLabels: {
                            font: { size: 11, weight: '600' },
                            color: '#374151'
                        },
                        ticks: {
                            display: false,
                            max: 40,
                            // EXPLICIT CALLBACK TO FIX RANGE ERROR
                            callback: function (value) { return value; }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            // EXPLICIT CALLBACK FOR TOOLTIP
                            label: function (context) {
                                return context.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. Audience Bar Chart
    const ctxAudienceEl = document.getElementById('audienceChart');
    if (ctxAudienceEl) {
        const ctxAudience = ctxAudienceEl.getContext('2d');
        new Chart(ctxAudience, {
            type: 'bar',
            data: {
                labels: ['Emagrecimento', 'Longevidade', 'Hipertrofia', 'Hormonal', 'Preventivo'],
                datasets: [{
                    label: 'Interesse Primário',
                    data: [45, 30, 15, 5, 5],
                    backgroundColor: [
                        '#B8860B',
                        '#1A1A1A',
                        '#D1D5DB',
                        '#D1D5DB',
                        '#D1D5DB'
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [2, 4], color: '#f3f4f6' },
                        ticks: {
                            // EXPLICIT CALLBACK TO FIX RANGE ERROR
                            callback: function (value) { return value + '%'; }
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1A1A1A',
                        titleFont: { family: "'Playfair Display', serif" },
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + '%';
                            }
                        }
                    }
                }
            }
        });
    }
});

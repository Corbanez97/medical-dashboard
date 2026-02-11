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



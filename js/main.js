document.getElementById('contact-form').addEventListener('submit', function (event) {
    event.preventDefault();
    alert('Merci pour votre message!');
    // Ajoutez ici le code pour envoyer le formulaire via une API ou autre
});


document.querySelectorAll('.circle').forEach(circle => {
    const fill = circle.querySelectorAll('.fill');
    const percentage = fill[0].getAttribute('data-percentage');
    const rotation = (percentage / 100) * 360;

    fill.forEach(f => {
        f.style.transform = `rotate(${rotation}deg)`;
    });

    circle.querySelector('.inside-circle').textContent = `${percentage}%`;
});

document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.slider-container');
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    const sliderDots = document.querySelector('.slider-dots');
    let currentIndex = 0;

    // Create dots
    slides.forEach((slide, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        sliderDots.appendChild(dot);
    });

    function goToSlide(index) {
        currentIndex = index;
        updateSlider();
    }

    function updateSlider() {
        const offset = -currentIndex * 100;
        slider.style.transform = `translateX(${offset}%)`;

        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Auto slide every 5 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider();
    }, 5000);
});



document.addEventListener('DOMContentLoaded', function(){
  // seleccionar las cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.cat; // valor de data-cat
      // redirigir a la página de categoría (usa query string)
      window.location.href = `categoria.html?cat=${encodeURIComponent(cat)}`;
    });
  });
});
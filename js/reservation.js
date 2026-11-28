const form = document.getElementById('reservationForm');
const message = document.getElementById('message');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const guests = Number(document.getElementById('guests').value);

  if (name.length < 3) {
    message.textContent = 'Please enter a valid name.';
    message.style.color = 'red';
    return;
  }
  if (!/^[0-9]{11}$/.test(phone)) {
    message.textContent = 'Phone must be 11 digits.';
    message.style.color = 'red';
    return;
  }
  if (new Date(date) < new Date(new Date().toDateString())) {
    message.textContent = 'Please choose a future date.';
    message.style.color = 'red';
    return;
  }
  if (guests < 1 || guests > 12) {
    message.textContent = 'Guests must be between 1 and 12.';
    message.style.color = 'red';
    return;
  }

  message.textContent = 'Table booked for ' + name + ' on ' + date + ' at ' + time + '.';
  message.style.color = 'green';
  form.reset();
});
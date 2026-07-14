document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", function () {
        this.classList.remove("input-error");

        const error = this.parentElement.querySelector(".error-message")
            || this.nextElementSibling;

        if (error && error.classList.contains("error-message")) {
            error.style.display = "none";
        }
    });
});

function togglePassword(id, element) {
  const input = document.getElementById(id);

  if(input.type === "password") {
    input.type = "text";
    element.textContent = "⌣";
  }
  else{
    input.type = "password";
    element.textContent = "👁";
  }
}
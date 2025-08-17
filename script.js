document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  document.getElementById("current-date").textContent = today;

  const tasks = [
    "10K Steps",
    "Log Food",
    "Workout (30+ min)",
    "Hydration (3L)",
    "Complete writing task",
    "List one positive thing",
    "Compliment Angela / Say 'I Love You'"
  ];

  const container = document.getElementById("task-list");

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `<input type="checkbox"><label>${task}</label>`;
    container.appendChild(div);
  });

  document.getElementById("finish-btn").addEventListener("click", () => {
    const unchecked = Array.from(document.querySelectorAll("#task-list input:not(:checked)"));
    if (unchecked.length > 0) {
      if (confirm("Some tasks are incomplete. Do you want to finish them before completing the day?")) {
        return;
      }
    }
    alert("Day Complete ✅");
  });
});

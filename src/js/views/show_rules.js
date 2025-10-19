export default function showRules(window, document) {
    const openModalBtn = document.querySelector(".help-btn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const myModal = document.getElementById("myModal");
    const modalContent = document.getElementById("modalContent");

    openModalBtn.addEventListener("click", async () => {
        try {
            const response = await fetch("./rules.html"); // Replace with your external HTML file
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            modalContent.innerHTML = htmlContent;
            myModal.showModal(); // Display the modal
        } catch (error) {
            console.error("Error loading external HTML:", error);
            // Handle the error (e.g., display an error message in the modal)
        }
    });

    closeModalBtn.addEventListener("click", () => {
        myModal.close(); // Close the modal
    });
}

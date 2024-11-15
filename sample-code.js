<script src="https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js"></script>


// Function to download the workflow as a PNG
function downloadPNG() {
    const svgElement = document.querySelector("svg");

    // Ensure the SVG is wrapped inside a container (optional, depending on your layout)
    const container = document.createElement("div");
    container.appendChild(svgElement.cloneNode(true));

    // Use dom-to-image to convert the container with SVG into a PNG
    domtoimage.toPng(container)
        .then(function (dataUrl) {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "workflow.png";
            link.click();
        })
        .catch(function (error) {
            console.error("Error generating PNG:", error);
        });
}

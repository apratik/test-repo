/* PNG Rendering Specific Styles */
.png-node rect {
    fill: transparent;
    stroke: #3498db; /* Blue color for stroke */
    stroke-width: 2;
    rx: 10; /* Rounded corners */
    ry: 10;
}

.png-node text {
    font-size: 12px;
    text-align: center;
    white-space: normal;
    fill: black;
}

.png-link {
    fill: none;
    stroke: #3498db; /* Blue color for links */
    stroke-width: 2;
}

.png-link.failure {
    stroke: #e74c3c; /* Red color for failure links */
}

.png-link-label {
    font-size: 10px;
    text-anchor: middle;
    fill: #7f8c8d; /* Grey color for link labels */
}




-----


    // Function to download the workflow as PNG
function downloadPNG() {
    const svgElement = document.querySelector("svg");

    // Create a clone of the SVG to apply PNG styles without affecting the original SVG
    const clonedSVG = svgElement.cloneNode(true);

    // Apply the PNG-specific styles by adding the .png-node and .png-link classes
    clonedSVG.querySelectorAll('g.node').forEach(node => {
        node.classList.add('png-node');
    });
    clonedSVG.querySelectorAll('path.link').forEach(link => {
        link.classList.add('png-link');
    });
    clonedSVG.querySelectorAll('text.link-label').forEach(linkLabel => {
        linkLabel.classList.add('png-link-label');
    });

    // Append the cloned SVG to a temporary container
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.visibility = "hidden";
    tempContainer.appendChild(clonedSVG);
    document.body.appendChild(tempContainer);

    // Use the DOM-to-image library to convert the cloned SVG to a PNG image
    domtoimage.toPng(clonedSVG)
        .then(function (dataUrl) {
            // Create a link element to download the PNG file
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'workflow.png';
            link.click();

            // Clean up the temporary container
            document.body.removeChild(tempContainer);
        })
        .catch(function (error) {
            console.error('Error generating PNG:', error);
            document.body.removeChild(tempContainer);
        });
}

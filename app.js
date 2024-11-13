let workflowData = [];

// Handle file upload and JSON parsing
document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("generateFlowButton").addEventListener("click", generateFlow);

// Handle component selection and configuration display
document.getElementById("closeConfigButton").addEventListener("click", closeConfigPanel);

// Load the workflow data and generate flow
function handleFileUpload(event) {
    const reader = new FileReader();
    reader.onload = function() {
        try {
            workflowData = JSON.parse(reader.result);
            populateComponentPanel(workflowData);
        } catch (e) {
            console.error("Invalid JSON format.");
        }
    };
    reader.readAsText(event.target.files[0]);
}

// Populate the left panel with component buttons based on the loaded JSON
function populateComponentPanel(data) {
    const componentButtonsContainer = document.getElementById("componentButtons");
    componentButtonsContainer.innerHTML = ""; // Clear any existing buttons

    // Generate buttons for each component
    data.forEach((component, index) => {
        const button = document.createElement("button");
        button.textContent = `${component.type} - ${component.taskId}`;
        button.addEventListener("click", () => showComponentConfig(component));
        componentButtonsContainer.appendChild(button);
    });
}

// Show the configuration for the selected component
function showComponentConfig(component) {
    const configPanel = document.getElementById("componentConfigText");
    configPanel.value = JSON.stringify(component, null, 2); // Display formatted JSON
}

// Close the config panel
function closeConfigPanel() {
    const configPanel = document.getElementById("componentConfigText");
    configPanel.value = ""; // Clear the content
}

// Generate the workflow graph
function generateFlow() {
    if (workflowData.length > 0) {
        renderGraph(workflowData);
    }
}

// Rendering graph functionality
function renderGraph(data) {
    const width = document.getElementById('graph').offsetWidth;
    const height = document.getElementById('graph').offsetHeight;

    const svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // Set up the force simulation for the graph
    const simulation = d3.forceSimulation(data)
        .force("link", d3.forceLink().id(d => d.taskId).distance(200))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Links (arrows between nodes)
    const links = svg.selectAll(".link")
        .data(generateLinks(data))
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-width", 2);

    // Nodes (components)
    const nodes = svg.selectAll(".node")
        .data(data)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("rect")
        .attr("width", 120)
        .attr("height", 60)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", d => getNodeColor(d.type))
        .on("click", (event, d) => showComponentConfig(d));

    nodes.append("text")
        .attr("x", 60)
        .attr("y", 30)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => d.taskId);

    // Update positions after each simulation tick
    simulation.on("tick", () => {
        links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        nodes
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

// Generate links based on prev and next nodes (nextOnSuccess and nextOnFailure)
function generateLinks(data) {
    let links = [];
    data.forEach(node => {
        if (node.nextOnSuccess) {
            let target = data.find(d => d.taskId === node.nextOnSuccess);
            if (target) {
                links.push({ source: node, target: target });
            }
        }
        if (node.nextOnFailure) {
            let target = data.find(d => d.taskId === node.nextOnFailure);
            if (target) {
                links.push({ source: node, target: target });
            }
        }
    });
    return links;
}

// Get the color for each component based on its type
function getNodeColor(type) {
    const colorMap = {
        "Type1": "#FF5733",
        "Type2": "#33FF57",
        "Type3": "#3357FF"
    };
    return colorMap[type] || "#CCCCCC"; // Default color if type is unknown
}

// Export workflow JSON to file
document.getElementById("exportButton").addEventListener("click", function() {
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
});

// Download the graph as SVG
document.getElementById("downloadGraphButton").addEventListener("click", function() {
    const svg = document.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.svg";
    a.click();
    URL.revokeObjectURL(url);
});

// Copy workflow JSON to clipboard
document.getElementById("copyJsonButton").addEventListener("click", function() {
    navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2)).then(() => {
        alert("Workflow JSON copied to clipboard!");
    });
});

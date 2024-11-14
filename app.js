document.getElementById('jsonFileInput').addEventListener('change', handleFileUpload);

// Handle file upload and parse JSON
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const workflowData = JSON.parse(e.target.result);
            if (workflowData && workflowData.workFlowTasks) {
                renderGraph(workflowData);
            } else {
                alert("Invalid workflow data.");
            }
        } catch (error) {
            alert('Invalid JSON format.');
        }
    };
    reader.readAsText(file);
}

function renderGraph(workflowData) {
    const svg = d3.select('#graph').html('').append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', '#f4f4f9'); // Page background color

    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Root for hierarchical data
    const root = d3.hierarchy({ name: "Root", children: workflowData.workFlowTasks }, d => d.nextOnSuccess)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name));

    const treeLayout = d3.tree().size([height, width]);
    treeLayout(root);

    // Links (arrows between nodes)
    const link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr("stroke", d => d.target.data.nextOnFailure ? "red" : "green") // Red for failure, green for success
        .attr("fill", "none");

    // Nodes (the components)
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // Rectangles for nodes
    node.append("rect")
        .attr("width", 150)
        .attr("height", 60)
        .attr("y", -30)
        .attr("x", -75)
        .attr("fill", d => d.data.type === 'START' ? '#d1e7dd' : '#fff')
        .attr("stroke", "#555");

    // Text inside the node (Component type)
    node.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text(d => d.data.type) // Component type as node label
        .style("font-size", "12px")
        .style("fill", "#333");

    // Task name under the component type
    node.append("text")
        .attr("dy", 18)
        .attr("text-anchor", "middle")
        .text(d => d.data.name) // Task name under the component
        .style("font-size", "10px")
        .style("fill", "#333");

    // Tooltip on hover to show task name
    node.append("title")
        .text(d => d.data.name);

    // Set up available components in the left panel
    const componentPanel = document.getElementById('componentButtons');
    workflowData.workFlowTasks.forEach(task => {
        const button = document.createElement('button');
        button.innerText = task.name;
        button.onclick = function() {
            alert(`Selected Task: ${task.name}\nType: ${task.type}\nPrev: ${task.prev}\nNext: ${task.nextOnSuccess}`);
        };
        componentPanel.appendChild(button);
    });
}

// Export to SVG file
document.getElementById('downloadGraphButton').addEventListener('click', function () {
    const svgElement = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow_graph.svg';
    a.click();
    URL.revokeObjectURL(url);
});

// Copy Workflow JSON to Clipboard
document.getElementById('copyJsonButton').addEventListener('click', function () {
    const workflowJson = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(workflowJson).then(function () {
        alert('Workflow JSON copied to clipboard!');
    }, function (err) {
        alert('Failed to copy text: ', err);
    });
});

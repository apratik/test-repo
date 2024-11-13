let workflowData = [];

// Handle file upload
document.getElementById('jsonFileInput').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const reader = new FileReader();

    reader.onload = function() {
        try {
            // Parse the JSON and handle any errors
            workflowData = JSON.parse(reader.result);
            populateComponentPanel(workflowData.workflowTasks); // Proceed with using the parsed JSON
            renderGraph(workflowData.workflowTasks); // Render the graph after loading
        } catch (e) {
            console.error("Invalid JSON format", e);
            alert("Invalid JSON format. Please check the file and try again.");
        }
    };

    reader.onerror = function() {
        alert("Error reading the file. Please try again.");
    };

    // Read the selected file as text
    reader.readAsText(event.target.files[0]);
}

// Populate the component panel with buttons based on JSON
function populateComponentPanel(data) {
    const componentButtonsContainer = document.getElementById('componentButtons');
    componentButtonsContainer.innerHTML = ''; // Clear existing components

    data.forEach(component => {
        const button = document.createElement('button');
        button.innerText = `${component.type} - ${component.taskId}`;
        button.addEventListener('click', () => {
            alert(`Component Type: ${component.type}\nTask ID: ${component.taskId}`);
        });
        componentButtonsContainer.appendChild(button);
    });
}

// Render the graph of the workflow from the JSON data
function renderGraph(data) {
    const width = 1200;
    const height = 800;
    const svg = d3.select("#graph").attr("width", width).attr("height", height);

    // Set up the color scale for component types
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Define nodes and links for D3
    const nodes = data.map((d, index) => ({
        id: d.taskId,
        type: d.type,
        taskId: d.taskId,
        x: Math.random() * width,
        y: Math.random() * height,
    }));

    // Create a map of taskId to node to help with linking
    const taskIdToNode = {};
    nodes.forEach(node => taskIdToNode[node.taskId] = node);

    // Create links based on prev, nextOnSuccess, and nextOnFailure
    const links = [];
    data.forEach(d => {
        if (d.prev) {
            links.push({
                source: taskIdToNode[d.prev],
                target: taskIdToNode[d.taskId],
                label: 'Prev',
            });
        }
        if (d.nextOnSuccess) {
            d.nextOnSuccess.forEach(nextTask => {
                links.push({
                    source: taskIdToNode[d.taskId],
                    target: taskIdToNode[nextTask],
                    label: 'Success',
                });
            });
        }
        if (d.nextOnFailure) {
            d.nextOnFailure.forEach(nextTask => {
                links.push({
                    source: taskIdToNode[d.taskId],
                    target: taskIdToNode[nextTask],
                    label: 'Failure',
                });
            });
        }
    });

    // Set up the force simulation for layout
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-200))
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Create link elements
    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "#ccc")
        .style("stroke-width", 2);

    // Create node elements
    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", d => colorScale(d.type));

    node.append("text")
        .attr("dx", 60)
        .attr("dy", 25)
        .attr("text-anchor", "middle")
        .text(d => d.taskId);

    // Update the positions of the nodes and links during the simulation
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Handle drag events
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

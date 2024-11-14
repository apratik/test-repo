let workflowData = null;

// This function handles the JSON file upload
document.getElementById('jsonFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                workflowData = JSON.parse(e.target.result);
                renderGraph(workflowData);
                populateComponents(workflowData);
            } catch (err) {
                alert('Invalid JSON format');
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid JSON file.');
    }
});

// Function to render the graph
function renderGraph(data) {
    const svg = d3.select('#graph');
    svg.selectAll('*').remove(); // Clear any existing graph

    // Process the workflow tasks and map them to fixed positions
    const tasks = data.workfLowTasks || [];
    const taskData = tasks.map(task => ({
        id: task.taskId,
        name: task.name,
        prev: task.prev,
        nextOnSuccess: task.nextOnSuccess,
        nextOnFailure: task.nextOnFailure,
        type: task.type
    }));

    // Set up a scale for colors based on task types
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add tasks as rectangles
    const taskElements = svg
        .selectAll('g')
        .data(taskData)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(150, ${50 + i * 150})`);

    taskElements
        .append('rect')
        .attr('width', 200)
        .attr('height', 80)
        .attr('rx', 10)
        .attr('ry', 10)
        .style('fill', d => colorScale(d.type));

    taskElements
        .append('text')
        .attr('x', 100)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '16px')
        .text(d => d.name);

    taskElements
        .append('text')
        .attr('x', 100)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '12px')
        .text(d => d.id);

    // Draw arrows for connections based on prev/nextOnSuccess/nextOnFailure
    taskData.forEach((task, index) => {
        if (task.prev) {
            const prevTask = taskData.find(t => t.id === task.prev);
            if (prevTask) {
                drawArrow(prevTask, task, 'black'); // Default color for prev
            }
        }
        if (task.nextOnSuccess) {
            task.nextOnSuccess.forEach(nextTaskId => {
                const nextTask = taskData.find(t => t.id === nextTaskId);
                if (nextTask) {
                    drawArrow(task, nextTask, 'green'); // Green for success
                }
            });
        }
        if (task.nextOnFailure) {
            task.nextOnFailure.forEach(nextTaskId => {
                const nextTask = taskData.find(t => t.id === nextTaskId);
                if (nextTask) {
                    drawArrow(task, nextTask, 'red'); // Red for failure
                }
            });
        }
    });
}

// Function to draw an arrow between two tasks
function drawArrow(fromTask, toTask, color) {
    const svg = d3.select('#graph');
    const fromX = 150 + 200; // Right side of the fromTask box
    const fromY = 50 + fromTask.index * 150 + 40; // Vertical center of the fromTask box
    const toX = 150; // Left side of the toTask box
    const toY = 50 + toTask.index * 150 + 40; // Vertical center of the toTask box

    svg.append('line')
        .attr('x1', fromX)
        .attr('y1', fromY)
        .attr('x2', toX)
        .attr('y2', toY)
        .attr('stroke', color) // Set the line color based on the connection type
        .attr('stroke-width', 2);

    // Draw an arrowhead
    svg.append('polygon')
        .attr('points', `${toX},${toY} ${toX - 10},${toY - 5} ${toX - 10},${toY + 5}`)
        .style('fill', color); // Set the arrowhead color
}

// Populate the "Available Components" list
function populateComponents(data) {
    const componentListDiv = document.getElementById('componentList');
    const tasks = data.workfLowTasks || [];
    componentListDiv.innerHTML = ''; // Clear previous components

    tasks.forEach(task => {
        const componentDiv = document.createElement('div');
        componentDiv.textContent = task.type; // Show type as the component name
        componentDiv.classList.add('component-item');
        componentListDiv.appendChild(componentDiv);
    });
}

let workflowData = null;
let taskData = [];

// This function handles the JSON file upload
document.getElementById('jsonFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                workflowData = JSON.parse(e.target.result); // Parse the JSON file
                console.log(workflowData); // Debug: Log the JSON to inspect its structure

                if (workflowData && workflowData.workflowTasks) {
                    taskData = workflowData.workflowTasks;
                    renderGraph();
                    populateComponents();
                } else {
                    alert('Invalid workflow data. "workflowTasks" not found.');
                }
            } catch (err) {
                alert('Invalid JSON format');
                console.error(err); // Log error to console
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid JSON file.');
    }
});

// Function to render the graph
function renderGraph() {
    const svg = d3.select('#graph');
    svg.selectAll('*').remove(); // Clear any existing graph

    // Ensure we have tasks data
    if (taskData.length === 0) {
        alert('No tasks found in workflow.');
        return;
    }

    // Set up a color scale for task types
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add task elements as rectangles in the SVG
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
        .text(d => d.type); // Task type as the component name

    taskElements
        .append('text')
        .attr('x', 100)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '12px')
        .text(d => d.taskId); // Task ID under the type

    // Draw arrows for connections based on prev, nextOnSuccess, and nextOnFailure
    taskData.forEach((task, index) => {
        if (task.prev) {
            const prevTask = taskData.find(t => t.taskId === task.prev);
            if (prevTask) {
                drawArrow(prevTask, task, 'black', task.name);
            }
        }
        if (task.nextOnSuccess) {
            task.nextOnSuccess.forEach(nextTaskId => {
                const nextTask = taskData.find(t => t.taskId === nextTaskId);
                if (nextTask) {
                    drawArrow(task, nextTask, 'green', task.name); // Green for success
                }
            });
        }
        if (task.nextOnFailure) {
            task.nextOnFailure.forEach(nextTaskId => {
                const nextTask = taskData.find(t => t.taskId === nextTaskId);
                if (nextTask) {
                    drawArrow(task, nextTask, 'red', task.name); // Red for failure
                }
            });
        }
    });
}

// Function to draw an arrow between two tasks with label
function drawArrow(fromTask, toTask, color, label) {
    const svg = d3.select('#graph');
    const fromX = 150 + 200; // Right side of the fromTask box
    const fromY = 50 + fromTask.index * 150 + 40; // Vertical center of the fromTask box
    const toX = 150; // Left side of the toTask box
    const toY = 50 + toTask.index * 150 + 40; // Vertical center of the toTask box

    // Draw the line
    svg.append('line')
        .attr('x1', fromX)
        .attr('y1', fromY)
        .attr('x2', toX)
        .attr('y2', toY)
        .attr('stroke', color)
        .attr('stroke-width', 2);

    // Draw an arrowhead
    svg.append('polygon')
        .attr('points', `${toX},${toY} ${toX - 10},${toY - 5} ${toX - 10},${toY + 5}`)
        .style('fill', color);

    // Draw label on the arrow
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    svg.append('text')
        .attr('x', midX)
        .attr('y', midY)
        .attr('text-anchor', 'middle')
        .style('fill', color)
        .style('font-size', '12px')
        .text(label); // Task name as the label
}

// Populate the "Available Components" list
function populateComponents() {
    const componentListDiv = document.getElementById('componentButtons');
    componentListDiv.innerHTML = ''; // Clear previous components

    taskData.forEach(task => {
        const componentDiv = document.createElement('div');
        componentDiv.textContent = task.type; // Show type as the component name
        componentDiv.classList.add('component-item');
        componentListDiv.appendChild(componentDiv);

        // Add click event to show task details (if needed)
        componentDiv.addEventListener('click', () => {
            alert(`Task ID: ${task.taskId}\nDescription: ${task.description}`);
        });
    });
}

// Button actions
document.getElementById('exportButton').addEventListener('click', () => {
    const jsonContent = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
});

document.getElementById('downloadGraphButton').addEventListener('click', () => {
    const svg = document.querySelector('#graph svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.svg';
    a.click();
});

document.getElementById('copyJsonButton').addEventListener('click', () => {
    const jsonContent = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(jsonContent).then(() => {
        alert('Workflow JSON copied to clipboard!');
    });
});

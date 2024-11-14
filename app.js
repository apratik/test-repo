function renderGraph(workflowData) {
    const taskNodes = workflowData.workflowTasks;

    // Create SVG container for the graph
    const svgWidth = 1000;
    const svgHeight = 500;
    const svg = d3.select('#graph')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight);

    // Define scales for positioning nodes
    const xScale = d3.scaleBand().padding(1).domain(taskNodes.map(d => d.taskId)).range([50, svgWidth - 50]);
    const yScale = d3.scaleLinear().domain([0, taskNodes.length]).range([50, svgHeight - 50]);

    // Create nodes (components)
    const taskGroups = svg.selectAll('g')
        .data(taskNodes)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${xScale(d.taskId)},${yScale(i)})`);

    // Create rectangles for task nodes
    taskGroups.append('rect')
        .attr('width', 150)
        .attr('height', 60)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', d => getColorByType(d.type)) // Color by component type
        .attr('stroke', 'black');

    // Add task name inside the rectangle
    taskGroups.append('text')
        .attr('x', 75) // Centering text horizontally
        .attr('y', 25) // Vertical position for the task name
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text(d => d.type);

    // Add task ID underneath the rectangle (task name)
    taskGroups.append('text')
        .attr('x', 75) // Centering text horizontally
        .attr('y', 45) // Slightly lower position for the task ID
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .text(d => d.taskId);

    // Create arrows and labels for connections
    taskNodes.forEach(task => {
        // Handle nextOnSuccess arrows (green)
        if (task.nextOnSuccess) {
            task.nextOnSuccess.forEach(successorId => {
                const successor = taskNodes.find(t => t.taskId === successorId);
                if (successor) {
                    createArrow(svg, task, successor, 'green'); // Green arrow for success
                }
            });
        }

        // Handle nextOnFailure arrows (red)
        if (task.nextOnFailure) {
            task.nextOnFailure.forEach(failureId => {
                const failure = taskNodes.find(t => t.taskId === failureId);
                if (failure) {
                    createArrow(svg, task, failure, 'red'); // Red arrow for failure
                }
            });
        }

        // Handle start of the flow (prev is null)
        if (task.prev === null) {
            // Mark this task as start with a label or other visual cue
            svg.append('text')
                .attr('x', xScale(task.taskId))
                .attr('y', yScale(taskNodes.indexOf(task)) - 10)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', 'blue')
                .text('START');
        }

        // Handle end of the flow (nextOnSuccess or nextOnFailure is null)
        if (!task.nextOnSuccess || task.nextOnSuccess.length === 0) {
            // Mark this task as end with a label or other visual cue
            svg.append('text')
                .attr('x', xScale(task.taskId))
                .attr('y', yScale(taskNodes.indexOf(task)) + 75)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', 'red')
                .text('END');
        }
    });
}

// Function to create arrows for connections
function createArrow(svg, source, target, color) {
    const sourceX = xScale(source.taskId) + 75;
    const sourceY = yScale(taskNodes.indexOf(source)) + 30;
    const targetX = xScale(target.taskId) + 75;
    const targetY = yScale(taskNodes.indexOf(target)) + 30;

    // Draw a line with an arrow
    svg.append('line')
        .attr('x1', sourceX)
        .attr('y1', sourceY)
        .attr('x2', targetX)
        .attr('y2', targetY)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

    // Add task name as a label on the arrow
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    svg.append('text')
        .attr('x', midX)
        .attr('y', midY - 10) // Adjust for label placement
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', color)
        .text(source.taskId); // Task name on the arrow
}

// Set color based on task type
function getColorByType(type) {
    const colors = {
        'START': 'lightgreen',
        'END': 'lightcoral',
        'DEFAULT': 'lightblue'
    };
    return colors[type] || colors['DEFAULT'];
}

// Handle Download Graph as SVG
document.getElementById('downloadGraphButton').addEventListener('click', function() {
    const svg = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow_graph.svg';
    a.click();
    URL.revokeObjectURL(url);
});

// Handle Export Workflow JSON
document.getElementById('exportButton').addEventListener('click', function() {
    const json = JSON.stringify(workflowData, null, 2); // Pretty print JSON
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow_data.json';
    a.click();
    URL.revokeObjectURL(url);
});

// Handle Copy Workflow JSON to Clipboard
document.getElementById('copyJsonButton').addEventListener('click', function() {
    const json = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(json)
        .then(() => {
            alert('Workflow JSON copied to clipboard!');
        })
        .catch(err => {
            console.error('Error copying to clipboard', err);
        });
});

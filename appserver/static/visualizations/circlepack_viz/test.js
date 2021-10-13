// Quantize: https://observablehq.com/@d3/d3-quantize
// ScaleLinear: https://observablehq.com/d/65ca753ff2fc5607#piecewise
// https://github.com/d3/d3-scale#api-reference

//https://observablehq.com/@d3/circle-packing
color = d3.scaleSequential([8, 0], d3.interpolateMagma)
color(d.height)

//https://observablehq.com/@d3/zoomable-circle-packing 
color = 

color(d.depth)

//https://observablehq.com/@d3/treemap
color = d3.scaleOrdinal(d3.schemeCategory10)
color(d.data.name);

//https://observablehq.com/@d3/sunburst
color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1))
color(d.data.name);

//https://observablehq.com/@mbostock/clustered-bubbles-2
d3.scaleOrdinal(d3.range(m), d3.schemeCategory10)
color(d.data.group)

// my function from sunburst
function getColor(elements) {
    var viz = this;
    if (viz.config.color.substr(0,1) === "s") {
        return d3.scaleOrdinal(d3[viz.config.color]);
    } else {
        return d3.scaleOrdinal(d3.quantize(d3[viz.config.color], elements + 1));
    }
}
color = viz.getColor(data.children.length);
color(d.data.name);

// color_len = Number(root.value);
// color = viz.getColor(color_len);
//color = d3.scaleLinear([0, root.value], d3.interpolateRainbow)
//color = d3.scaleOrdinal(d3.quantize(d3[viz.config.color], Number(root.value)))
//color = d3.scaleLinear(getColor(Number(root.value))); // //d3.scaleSequential([0, Number(root.value)], d3[viz.config.color])

function getColor() {
    var viz = this;
    if (viz.config.color.substr(0,1) === "s") {
        return d3.scaleOrdinal(d3[viz.config.color]);
    } else {
        return d3.scaleOrdinal(d3.quantize(d3[viz.config.color], elements + 1));
    }
}

function getColor(count) {
    var viz = this;
    if (viz.config.color.substr(0,1) === "s") {
        return d3.scaleOrdinal(d3[viz.config.color]);
    } else {
        return d3.scaleSequential([0, count], d3[viz.config.color])
    }
}
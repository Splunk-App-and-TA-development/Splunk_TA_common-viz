### Splunk Visualization - Donut Chart

> The donut chart is a variation of the standard pie chart. This chart will display results as a
> percentage of the whole.

#### How to Use the Donut Chart

> This chart has the ability to be displayed as either a two-dimensional or three-dimensional
> chart. This chart provides some interactivity. Mouseover a section of the chart to display
> the associated results. Click on a slice to drill down into the raw results.

#### Configuration Options

> The donut chart has many different configuration options and is resizable. The options are split into sections
> related to each type of chart. The options are displayed like this:

* Configuration Option Name
    * Valid Setting Options
    * Description

##### Format

* Chart Type
    * 2D, 3D
    * Toggles between 2-dimensional and 3-dimensional
    
* Min Percent
    * &lt;float&gt;
    * Controls the minimum percent of the total events before a result is included in the "Other" category.
    
* Use Min Percent
    * &lt;boolean&gt;
    * Controls whether event counts are rolled into the "Other" category based on the min percent value.

##### Colors

* Color Scheme
    * Predefined, Custom
    * Use one of the predefined color schemes or specify your own color scheme

* Predefined Category
    * Select from the predefined color schemes for D3 charts (category10, category20, category20b, category20c)

* Custom color palette
    * Specify a list of comma-separated hex color codes that should be used with the chart

##### Legend

* Show Legend
    * Yes, No
    * Toggles the legend.
    
* Text Size (px)
    * &lt;integer&gt;
    * Size of the legend text in number of pixels.
    
* Legend Item Width (px)
    * &lt;integer&gt;
    * Length of each item in the legend in number of pixels.

* Position
    * Left, Right, Top, Bottom
    * Controls where the legend is placed in relation to the chart.
    
##### 2D Chart

* Donut Width
    * &lt;integer&gt;
    * Controls the width of the donut hole.
    
##### 3D Chart

* X Radius
    * &lt;integer&gt;
    * Controls the radius of the chart on the X axis.
    
* Y Radius
    * &lt;integer&gt;
    * Controls the radius of the chart on the Y axis.

* Height
    * &lt;integer&gt;
    * Controls the thickness of the chart.
    
* Inner Radius
    * &lt;float&gt;
    * Controls the width of the donut hole.
    
##### Drilldown

* Drilldown
    * Yes, No
    * Allow drilldown into results.
    
##### Debug

* Javascript Logging
    * Yes, No
    * Disables or enables the logging of debug information for the visualization.

#### Example search

Example: index=_internal | stats count by sourcetype

#### Event generator

This app does not have an event generator.

#### Support

Please ask a question on Answers. Tag it with "aplura_viz" to get noticed. Support URL: answers.splunk.com

#### Third-party software

 These visualizations use third-party software. Refer to each Viz Readme for specifics.

#### Acceleration

Report Acceleration: None
Data Model Acceleration: None
Summary Indexing: None

# **Flow Map Viz**

A visualization used to show the volume of traffic across links.
By default, this addon will normalise the traffic flows so the proportion of traffic can be shown, however this can be disabled.
Optionally show marching ants lines to indicate direction. Optionally allows embedded HTML which enables endless customisation. AKA force-directed or network graph.



## **Usage**
This visualisation expects tabular data, with specific field names.
There are two kinds of row data that should be supplied: links and nodes. The link data is identified by having both a from and to field, or a path field.
The path field is delimited by three hyphens "---" and can include hops through multiple nodes. The node data will have a node field.

### **Example 1, simple links using `from / to` fields**
| from | to | good
|---|---|---|
| users | loadbalancer | 3000 |
| loadbalancer | webserver1 | 1000 |
| loadbalancer | webserver2 | 1500 |
| loadbalancer | webserver3 | 500 |

Note that nodes are automatically created.

![example-1](https://cdn.apps.splunk.com/media/public/docimages/b896838e-c72d-11e9-90ac-06a3434e669e.png)


### **Example 2, same output using path field**
| path | good |
|---|---|
| users---loadbalancer---webserver1 | 1000 |
| users---loadbalancer---webserver2 | 1500 |
| users---loadbalancer---webserver3 | 500 |

Shared links will have the fields "good", "warn" and "error" automatically summed together



### **Example 3, customise output by adding "node" rows**
For the users and loadbalancer rows, a custom label is set, along with a font-awesome icon and the label is moved underneath.

| path | good | node | label | icon | height | labely |
|---|---|---|---|---|---|---|
| users---loadbalancer---webserver1 | 1000 |  |  |  |  |  |
| users---loadbalancer---webserver2 | 1500 |  |  |  |  |  |
| users---loadbalancer---webserver3 | 500 |  |  |  |  |  |
| users---loadbalancer---webserver3 | 500 |  |  |  |  |  |
|  |  | users | Users | user | 40 | 30 |
|  |  | loadbalancer | LoadBalancer | hdd | 40 | 30 |

![example-3](https://cdn.apps.splunk.com/media/public/docimages/915328d6-c72d-11e9-b5db-06a551a85bba.png)


Its an unsual concept to have a single search that produces two different sets of data, however this can be easily performed using append.

For example you can define all nodes and links in a lookup table and append it after all your search data like so:
```
existing search | append [ |inputlookup my_table_of_nodes_and_links.csv ]
```



## **How to manually set positions**

![example-set-positions1](https://cdn.apps.splunk.com/media/public/docimages/5b53eb70-c779-11e9-999d-06a551a85bba.png)

![example-set-positions2](https://cdn.apps.splunk.com/media/public/docimages/630ed320-c779-11e9-bf74-067b05443948.png)

Double click a node disable its manual positioning.


### **Data domain**
By default, the amount of particles shown is automatically ranged/scaled (using linear interpolation) based on the data supplied.
The visualization finds the link that has the largest volume of (good + warn + error) and uses that as the upper bound.
The formatter option "Particles" > "Data domain", allows manually defining the range that the data is expected to fall into.
The value can be set either as a single value representing the maximum (min will default to 0) or a comma seperated pair of numbers (min,max).



### **Tokens and Drilldowns**
Tokens will be set when clicking on nodes or link labels. Hit "F12" to open browser developer tools, then open the "Console" to observe how tokens are being set.

- **Nodes:** `$flow_map_viz-label$, $flow_map_viz-node$, $flow_map_viz-drilldown$, $flow_map_viz-type$`
- **Links:** `$flow_map_viz-label$, $flow_map_viz-link$, $flow_map_viz-from$, $flow_map_viz-to$, $flow_map_viz-type$`

Link labels can be used for drilldowns to other Splunk dashboards etc. However that as nodes can be dragged to reposition, these can't be used for drilldowns.
A work-around for drilldown on nodes, enable the "Advanced" > "HTML Labels" formatter option, and then set the "label" data field to include a html "a" tag to link to your required destination. E.g.
```
existing_query | eval label = "<a href='search?q=" + drilldown + "' target='_blank' style='text-decoration:none;'>" + node_label + "</a>"
```


## **Building a complex flow map using a lookup**
Attemping to set the various node and link options can lead to a messy SPL query.
A neat way to solve this is to build a lookup table of all the nodes and links, and then |append it to the end of your real data.
If the same link pair exists in multiple rows, then the "good", "warn" and "error" fields will be summed.
For other link customisations such as "speed" and "width" the last set property will take effect.
```
existing query | append [|inputlookup my_flowmap_config.csv]
```


Here is an search that will generate a template CSV file called `my_flowmap_config.csv`:
```
| makeresults count=10
| fillnull value="" node from to height radius opacity position icon good warn error color width distance speed labelx labely fromside toside tooltip label
| table node from to height width radius opacity position icon good warn error color distance speed label labelx labely fromside toside tooltip
| outputlookup my_flowmap_config.csv
```


## **Field reference**

### **link fields**

| Field | Type | Description |
|---|---|---|
| from | String | An ID of node to use as the source of the link. |
| to | String | An ID of node to use as the target of the link. |
| path | String | A series of nodes to link together, seperated by three hypens "---". Should not be specified for the same row that has from/to fields or it will be ignored. |
| good | Number | A value representing the volume of good traffic, which will be normalised (by default) and displayed as particles (the "good" color can be set in the formatting options and defaults to dark green). |
| warn | Number | A value representing the volume of warning traffic, which will be normalised (by default) and displayed as particles (the "warn" color can be set in the formatting options and defaults to orange). |
| error | Number | A value representing the volume of error traffic, which will be normalised (by default) and displayed as particles (the "error" color can be set in the formatting options and defaults to red). |
| color | HTML color code | Set the color of the line |
| width | Number | Set the width of the line |
| distance | Number | Set the length of the line. This field is redundant if you are manually positioning nodes. |
| speed | String | The speed of the particles. Between 1 and 100. Defaults to 90. |
| labelx | Number | Offset the label left and right from the centre of the line. Measured in pixels. Negative values move left. |
| labely | Number | Offset the label up and down from the centre of the line. Measured in pixels. Negative values move up. |
| fromside | String | Specify a custom attachment point on the source node. See note [1] below. |
| toside | String | Specify a custom attachment point on the target node. See note [1] below. |
| tooltip | String | Specify a custom hover tooltip for the line |
| label | String | Specify a custom label to occur on the line. If "allow HTML" is enabled in formatter options, this field can contain HTML such as <br/> to create a new line. |
| drilldown | String | A field that will be set to token `$flow_map_viz-drilldown$` when this link label is clicked. |


[1] fromside / toside: Possible values are top, bottom, right, left. Defaults to the centre of the node. The value can also be specified with a modifier (+/-) to tune where on that side the attachment occurs. For example: "bottom-10" will attach to the bottom side, 10px to the left of center, "top+20" will attach to the top and 20 pixels to the right of center. When using path with multiple nodes, the fromside only affects the first node and the toside only affects the last node.


### **node fields**

| Field | Type | Description |
|---|---|---|
| node | String | The ID of a node. Nodes can be disconnected with no links. |
| icon | Number | A font awesome icon name. From here: https://fontawesome.com/icons?d=gallery&m=free . Defaults to the font-awesome solid icon set (fas). Supply "far ICON" to use font awesome regular. |
| label | String | Set a custom label. If "allow HTML" is enabled in formatter options, this field can contain HTML such as <br/> to create a new line. Defaults to the node ID value. |
| labelx | String | Offset the label left and right from the centre of the node. Measured in pixels. Negative values move left. |
| labely | Number | Offset the label up and down from the centre of the node. Measured in pixels. Negative values move up. |
| height | Number | The height of the node in pixels. |
| width | Number | The width of the node in pixels. |
| color | HTML color code | Set the color of the node. |
| radius | Number | Set the border radius in pixels. Set to the same value as the height and width to make the node a circe. |
| opacity | Number | A value between 0 (transparent) and 1 (opaque) |
| position | String | A comma seperated pair of coordinates. First number is the horizontal position and second is the vertical position as a percentage of available space in the frame. Values should be between 0 and 100 |
| drilldown | String | A field that will be set to token $flow_map_viz-drilldown$ when this node is clicked. |
| order | Number | The stacking order of the node. Defaults to 50. Lower numbers stack under higher numbers. A negative value will stack underneath everything else |
| tooltip | String | Specify a custom hover tooltip for the node. Can contain HTML if you have enabled this option in the formatter settings |



## **Third party software**
The following third-party libraries are used by this app. Thank you!

- jQuery - MIT - https://jquery.com/
- D3 - BSD 3-Clause - https://d3js.org/
- Font Awesome - Creative Commons Attribution-ShareAlike 4.0 License - https://fontawesome.com/
- TinyColor - MIT - https://github.com/bgrins/TinyColor



## **Release Notes**
Version 1.4.11<br>
Feb. 8, 2021

#### 1.4.11
* Minor bug fix where "copy positions" button would not work.

#### 1.4.10
* Clicking on the background will now unset any flow_map_viz-* tokens

#### 1.4.9
* You can now stack nodes underneath links by setting the "order" field to a negative value
* Tooltips now support HTML snippets (if enabled in the formatter settings)

#### 1.4.5
* Fix bug where node icons would not update color
* Fix bug where "copy to clipboard" did not work on non-HTTPS sites.
* Added configurable tooltip on "nodes"

#### 1.4.3
* Sets tokens when clicking nodes/links. Drilldowns can only be set on links.
* Fix bug where sometimes link speed did not update properly
* New menu feature where particles speed can be slowed easily when using data domain

#### 1.4.2
* Added automatic fallback to canvas if browser does not support webgl


Copyright (C) 2020 Chris Younger | [Splunkbase](https://splunkbase.splunk.com/app/4657/#/details) | [Source code](https://github.com/ChrisYounger/flow_map_viz) |  [Questions, Bugs or Suggestions](https://answers.splunk.com/app/questions/4657.html) | [My Splunk apps](https://splunkbase.splunk.com/apps/#/author/chrisyoungerjds)

![screenshot](https://raw.githubusercontent.com/ChrisYounger/flow_map_viz/master/appserver/static/demo.png)

For usage instructions see Splunkbase or the "help" tab on the formatter menu.


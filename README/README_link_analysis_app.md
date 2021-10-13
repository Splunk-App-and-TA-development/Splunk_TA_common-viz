# **Link Analysis App For Splunk**
This app provides a seperate visualisation framework for doing force directed visualisation with additional functionality.
For more about the visualisation framework visit here.
https://github.com/cytoscape/cytoscape.js

### Installation Instructions
1. Download the app and unzip to $SPLUNK_HOME/etc/apps on your Search Head
2. Restart Splunk
3. Generate a search that has a 'source', 'target' and optionally a count. 

### Basic Search Examples
- `index=firewall action=allowed | stats count by src_ip, dest_ip | table src_ip, dest_ip, count`
- `sourcetype=access_combined | stats count by src_ip,uri_path`

### Extended Search Examples

#### Optional Fields
- **line_label** - To specify the line label of an edge
```index=firewall action=allowed | stats count by src_ip, dest_ip, dest_port | rename dest_port as line_label```
***Will make the destination port the line label***
- **line_color** - To specify a color of an edge
```index=firewall action=allowed | stats count by src_ip, dest_ip | eval line_color=if(count>10,"red","green"```
***If count is greater than 10 make the line red else make it green.***
- **remove** - For huge graphs, it is often faster to remove all nodes off of the graph and start with only one node on the graph.  All nodes that have any children can be expanded from here.
```index=firewall action=allowed | stats count by src_ip, dest_ip | eval remove="192.168.1.1```
***Remove all nodes from the graph except 192.168.1.1, if 192.168.1.1 is clicked the children will be re-added to the graph***
- **preFilter** - Allows you to prefilter your graph and remove all nodes that are connected to the node specified in the field.
***Delete all nodes from the graph that are not children of 192.168.1.1***

### Configuration Options

#### Format Menu - Vizualization Style

###### Layout Style
Layout styles allow you to change the format of the graph.  Not every format is useful for every data type.  Test with all of the layouts.  Some are also faster than others (Grid is the fastest)
  - FCose (Default)
  - Grid
  - Circle
  - Klay
  - Dagre
  - Concentric
  - Breadthfirst
  - Spread
  - Cose

###### Path Selection Algorithm
This app allows you to build paths between nodes.  The path algorithm is customisable to give you different outcomes.
  - Dijikstra (Default)
  - aStar
  - floydWarshall
  - bellmanFord

###### Path Selection Directed
When performing path highlighting, you can honor the direction of the path by selecting true. So in the following scenario if you wanted to map a path from A through to C in the following  ```A:B B:C``` setting this setting to False would allow the path to be created.
  - True
  - False (Default)

#### Node Selection Options
If you click and hold on a node, a context relevant menu will pop-up with the following options.
- Hlt All Paths (Highlight All Paths)
This option allows you to highlight all paths from the node recursively honoring the direction set in the format menu.  It will add a highlighted class to the nodes selected
- Single Path Select
This option allows you to draw a single path using the Algorithm in the format menu and honoring the direction set.  To use this option, press and hold on the starting node and select ```Single Path Select``` then click and hold the target node and select ```Single Path Select```.  If a path can be found the nodes will be highlighted.
- Condense
The condense option will condense the immediate children around the selected node in a concentric layout
- Focus
Same as condense.  But with a reset button.

#### Core Selection Options
If you click and hold in blank space on the node, a context relevant menu will pop-up with the following options.
- Menu 
Brings up an additional menu with the following options
    - Clear Formatting - Removes the highlighted class from all nodes
    - Delete Highlighted Items - Remove all highlighted items
    - Delete Non Highlighted Items - Remove all non highlighted items
    - Refresh - Refreshes the layout, useful when you have removed nodes and want the layout to be recomputed.
    - Save State - Allows you to save the state of the graph.  Please read save state below.
    - Style Edges - Allows you to enter a single term and a color to modify the style of the edge with that value (Originally Search Edges)
- Search Nodes - Allows you to find a node on the graph and zoom into the node.

#### Save State
An option exists in the framework to allow you to save the state of the graph.  This becomes really useful when you want to share your view with another analyst.  Before doing this you need to have the following.
- HTTP Event Collector Configured with an index of ```cyto```
- A valid certificate for your HTTP Event Collector
- CORS Configured to allow requests
This call is performed via javascript so requires something similar to the following setup.
https://answers.splunk.com/answers/766107/how-do-i-send-data-to-http-event-collector-via-jav.html

### Bugs / Missing Docos
Please report any bugs to github, Splunk Answers or alternatively hit me up on twitter @MickeyPerre

### Feature Requests
Post any feature requests as issues and I will look around to them.  My only feedback prior to making feature requests is ensuring that the feature does not reduce the flexibility of the app :).

### Tested on
**Mac**

### License
- This app uses D3 with the following license conditions
[Here](https://github.com/d3/d3/blob/master/LICENSE)
- This app uses Cytoscape js with the following license conditions
[Here](https://raw.githubusercontent.com/cytoscape/cytoscape.js/master/LICENSE)
- This app uses the FCose Layout that was created after research with the following paper
[Here](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4708103/)
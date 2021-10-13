# **Splunk Sankey Diagram - Custom Visualization**

Custom Visualizations give you new interactive ways to visualize your data during search and investigation, and to better communicate results in dashboards and reports. After installing this app you’ll find a Sankey diagram as an additional item in the visualization picker in Search and Dashboard.

Sankey diagrams show metric flows and category relationships. You can use a Sankey diagram to visualize relationship density and trends.

A Sankey diagram shows category nodes on vertical axes. Fluid lines show links between source and target categories. Link width indicates relationship strength between a source and target.


## **Release Notes** 
Version 1.5.0

Aug. 4, 2020

https://docs.splunk.com/Documentation/SankeyDiagram/1.5.0/SankeyDiagramViz/SankeyReleaseNotes




## **Create a Sankey diagram query**
To generate a Sankey diagram, write a query that returns events in the correct data format.

## **Query syntax**
To generate a Sankey diagram, use this query syntax.
```
... | stats <stats_function>(<size_field>) [<stats_function>(<color_field>)] by <source_category_field> <target_category_field>
```

## **Query components**
A Sankey diagram query includes the following components.

#### **size_field**
- **Required**
- This field determines link width between source and target categories. Use a stats function to aggregate values in this field.

#### **color_field**
- Optional
- This field determines link color. Sankey diagrams that include a color field are called "double measure".

#### **source_category_field** 
- **Required**
- Metric flow starts in this field. This is sometimes described as the "from" category.

#### **target_category_field**
- **Required**
- Metric flow ends in this field. This is sometimes described as the "to" category.

## **Search result data formatting**
The Sankey diagram query syntax returns results in a table with multiple columns. Columns represent data for source, target, connection size, and connection color.

Check the Statistics tab after running a query to make sure that the results table includes the correct columns in the required order.

### **Results table columns** 
| First | Second | Third | Fourth |
|---|---|---|---|
| Source | Target | Link size | Link color |

## **Example query**
Here is part of a Sankey diagram query tracking byte transfer sums between source and target hosts.

... | stats sum(bytes) count by source target


The query generates a results table with columns for the source, target, sum(bytes), and count fields.
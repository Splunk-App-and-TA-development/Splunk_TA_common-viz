# **Status Indicator - Custom Visualization**

Custom Visualizations give you new interactive ways to visualize your data during search and investigation, and to better communicate results in dashboards and reports. After installing this app you’ll find a status indicator as an additional item in the visualization picker in Search and Dashboard.

Status indicators show a value and an icon. You can use a status indicator to provide information at a glance.


## **Release Notes** 

Version 1.4.0

Oct. 29, 2019

https://docs.splunk.com/Documentation/StatusIndicator/1.3.0/StatusIndicatorViz/StatusIndicatorIntro



## **Create a status indicator query**
To generate a status indicator, write a query that returns events in the correct data format.


### **Query syntax** 
To generate a status indicator, use the following query syntax.
```
...| table <count> <icon_field> <color_field>
```
Aggregate the value you are tracking and use the table command to order field values.


### **Query components** 
A status indicator query includes the following components.

#### **<count>**
- **Required**
- This field represents the metric you are tracking. Use a stats function to aggregate field values.

#### **<icon_field>**
- Optional.
- For dynamic icons from a query using the rangemap command, assign an icon name to a range_field value range. Use the Format menu to show icons and to enable field value icons.
- To use a static icon, set the icon value to any icon from the _Font-Awesome icon set_. Use the Format menu to show icons and to enable field value icons.

#### **<color_field>**

- Optional. Use one or more times to specify multiple colors and ranges.
- For dynamic colors from a query using the rangemap command, assign a specific <"#hex_value"> to a range_field value range.Use the Format menu to enable field value colors.
- To use a static color, set the color value to any hex color. Use the Format menu to show icons and to enable field value icons.

## **Search result data formatting**
The status indicator query syntax returns results in a table with multiple columns. Columns represent the aggregated metric, icon field, and color field.

Check the Statistics tab after running a query to make sure that the results table includes the correct columns in the required order.

#### Results table columns
| First | Second | Third |
|---|---|---|
| Count | Icon (optional) | Color (optional) |

## Example query
Here is a status indicator query that specifies a static icon and color.
```
index=_internal
| head 100
| stats count
| eval count=count+random()%1000
| eval icon="exclamation-circle"
| eval color="#F58F39"
| table count icon color
```
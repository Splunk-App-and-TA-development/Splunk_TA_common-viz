# **Treemap - Custom Visualization**
Custom Visualizations give you new interactive ways to visualize your data during search and investigation, and to better communicate results in dashboards and reports. After installing this app you’ll find a treemap as an additional item in the visualization picker in Search and Dashboard.

A treemap represents data patterns and hierarchy. Each treemap divides a single space into multiple rectangles to show data values and category relationships.


## **What treemaps visualize**
A treemap represents data patterns and hierarchy. Each treemap divides a single space into multiple rectangles to show data values and category relationships.

## **Use cases**
Use a treemap to visualize how a general metric divides across different areas or categories.

- Budgets and expenses** 
- Data center server status
- University departments and courses offered

## **Data for treemaps** 
A treemap data set includes metric and category information for all events. Use events with fields representing the common metric value, child, and parent categories.
See the use case examples for more details.


## **Create a treemap query**
To generate a treemap, write a query that returns events in the correct data format.

### Query syntax
To generate a treemap visualization, use this query syntax.

```
... | stats <stats_function>(<metric_field>) [<stats_function>(<color_field>)] by <parent_category_field> <child_category_field>
```

### Query components
A treemap query includes the following components.

#### metric_field
- **Required**
- Determines rectangle size.
- Indicates which field to use for the metric in each event. For example, the data might include a cost field for each expense event.

#### color_field
- Optional
- Determines the rectangle color.
- If not specified, the parent category determines rectangle color. Each parent category gets a different color in this case.
- If specified, two cases are possible.
 - If a category field is used, then a categorical color scale is applied to the treemap.
 - If a non-categorical field is used, then a linear numerical color scale is applied to the treemap.

#### parent_category_field
- **Required**
- Use the field that indicates parent category in each event. For example, the data might include an expense_group field to indicate an expense category.

#### child_category_field
- **Required**
- Use the field that indicates the child category in each event. For example, the data might include an expense_subgroup field to indicate a particular expense type.


## **Search result data formatting**
The treemap query syntax returns results in a table with multiple columns. Columns represent data for rectangle parent and child categories, size, and color.

Check the Statistics tab after running a query to make sure that the results table includes the correct columns in the required order.

#### Results table columns
| First | Second | Third | Fourth |
|---|---|---|---|
| Parent category | Child category | Rectangle size | Rectangle color |

## **Query example**
Here is part of a query tracking files and directories.
```
... | stats sum(size) as size by parent_directory, child_directory
```
The query generates a results table with columns for the parent_directory, child_directory, and size fields. An optional color field is left out.


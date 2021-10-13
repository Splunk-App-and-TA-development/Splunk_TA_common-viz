# **Punchcard - Custom Visualization**

Custom Visualizations give you new interactive ways to visualize your data during search and investigation, and to better communicate results in dashboards and reports. After installing this app you’ll find a punchcard visualization as an additional item in the visualization picker in Search and Dashboard.

Punchcards can visualize cyclical trends in your data. This visualization shows circles representing a metric aggregated over two dimensions, such as hours of the day and days of the week. Using a punchcard, you can see relative values for a metric where the dimensions intersect.


## **Release Notes**
Version 1.4.0

Oct. 29, 2019

https://docs.splunk.com/Documentation/Punchcard/1.4.0/PunchcardViz/PunchcardIntro


## **What punchcards visualize**
Punchcards can visualize cyclical trends in your data. This visualization shows circles representing a metric aggregated over two dimensions, such as hours of the day and days of the week. Using a punchcard, you can see relative values for a metric where the dimensions intersect.

### Use case examples
- Website or network activity
- Retail trend analysis
- Environmental or geological activity


## **Create a punchcard search**
To create a punchcard, you must use a search that returns data in the correct format.

### **Search syntax**
Use this syntax to generate a punchcard.
```
... | <stats_function>[(metric_field)] [<stats_function>(color_field)] by <first_dimension> <second_dimension>
```

### **Search components**

#### **<stats_function>**
- **Required**
- Determines circle size.
- Use this function to aggregate the metric you are tracking.

#### **color_field**
- Optional
- Determines circle color.
- Use a stats function to aggregate values in this field.
- For sequential color mode, values in this field must be numerical.

#### **<first_dimension>**
- **Required**
- Represents the first dimension for plotting results.
- For example, you can use a time field such as date_hour.

#### **<second_dimension>**
- **Required**
- Represents the second dimension for plotting results, usually more granular than the first dimension.
- For example, you can use a time field such as date_wday.

## **Search results data format**
After running the search, check the Statistics tab. The results table includes columns representing the metric, color field, and two time dimensions.

Make sure that the results table has columns for required fields in this order.

| First | Second | Third | Fourth |
|---|---|---|---|
| first_dimension | second_dimension | count or other aggregated value | color_field (optional) |

## **Search example**
Here is a search that analyzes bicycle rental popularity by hours and days.
```
inputlookup bikeshare.csv | stats count by date_hour date_wday
```
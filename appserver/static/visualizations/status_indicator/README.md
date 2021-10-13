# Status Indicator

Documentation:
http://docs.splunk.com/Documentation/StatusIndicator/1.2.0/StatusIndicatorViz/StatusIndicatorIntro

## Sample Searches

```
| stats count
```

```
| stats count | eval icon = "warning" | eval color = "#FF00FF"
```

## Data Format
value [, icon, color]
# Punchcard

Documentation:
http://docs.splunk.com/Documentation/Punchcard/1.2.0/PunchcardViz/PunchcardIntro

## Sample Searches

```
index=_internal | head 100000 | stats count by date_hour sourcetype
```

```
index=_internal | head 100000 | stats count by date_minute sourcetype
```

```
index=_internal | head 100000 | stats count, avg(date_minute) by date_minute sourcetype
```
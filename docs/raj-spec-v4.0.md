# 4.0 Version New Features

## Task #1 - Introduce proper logging and tracing of all user actions

all errors needs to be logged. All user calls, routing, frontend, backend including database calls needs to be traced using some unique request ID and be stored remotely to some external storage. For now simulate this behavior by storing this in a local trace.log file. In future, i should be able to migrate this easily to external storage or publish via kafka.

## Task #2 - Image storage

Images corresponding to rental items should be stored in a proper image data store instead of storing them on local file system. What do you suggest?

## Task #3 - Backend improvements suggested in [architecture.md](http://architecture.md) file for V3.1

Look at Areas of Improvement for backend from this [architecture.md](http://architecture.md) file and fix issues 1,2,3,4,5,6,7,9,10.

## Task #4 - Frontend improvements suggested in [architecture.md](http://architecture.md) file for V3.1

Look at Areas of Improvement for frontend from this [architecture.md](http://architecture.md) file and fix issues 1,2,3,4,5,6orr
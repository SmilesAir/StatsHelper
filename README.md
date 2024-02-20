# StatsHelper
V1 for entering and tracking stats for Freestyle Frisbee

## Backend Data
1 Dynamo Table
EventKey+PoolKey+[PlayerKey1+PlayerKey2+...]
JSON blob

## Backend API
Set data: EventKey, PoolKey, PlayerKeyArray, DataBlob
Get data: EventKey, PoolKey, PlayerKeyArray


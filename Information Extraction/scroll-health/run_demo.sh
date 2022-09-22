#!/usr/bin/env bash
set -e
export MAVEN_OPTS=-Xmx2g
if [[ $# -lt 1 ]]; then
    mvn exec:java -DskipTests -Dexec.args="PescriptionPipeline" -e
    exit 1
fi
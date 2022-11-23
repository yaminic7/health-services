# Prescription tool for Information Extraction

This repository provides the code of the Deep learning tool used within the Information Extraction service. It is an integral part of the Information Extraction pipeline used for IEHR. It is a component developed using an external tool as the starting point[1].

This tool is used for Named Entity Recognition task to identify the following entities,DrugProduct, DrugIngredient, Strength, StrengthUnit, Form, Frequency, PeriodUnit, Note on the prescription text in Italian and French languages.
For example the result of the this Italian prescription is as follows,

DrugProduct | DrugIngredient | Strength | StrengthUnit | Form | Frequency | PeriodUnit | Note
--- | --- | --- | --- | --- | --- | --- | --- |
monoket | Isosorbide mononitrato | 60 | mg | cpr. divisibili | 1 | die | ore 8

Prescription tool runs on two pre-trained Bert models [2],[3] which are fine-tuned to the Italian and French language presriptions. The prescriptions are manually prepared.With good evaluation results, these models are deployed in API using a python web-framework,FastAPI. This API gives an endpoint the access these models in he language of our choice using a HTTP request. The response JSON is further processed along the pipeline.

This component is dockerised and can be deployed on a system using the docker-compose.yml file.

# References 
[1] NER and Relation Extraction from EHR : https://github.com/smitkiri/ehr-relation-extraction

[2] Italian BERT (For Italian language) : https://huggingface.co/dbmdz/bert-base-italian-cased

[3] bert-base-multilingual-uncased (For French language) : https://huggingface.co/bert-base-multilingual-uncased

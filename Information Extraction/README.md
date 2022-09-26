# Information Extraction
This repository includes code for The Information Extraction library, integrated into the InteropEHRate Health Services, allows the conversion of natural-language text inside datasets into fully structured data. This comprises both short pieces of text inside structured data and entirely unstructured raw-text documents. What the library does is take one or more natural-language strings as input and provide annotations as output, where the annotations correspond to structured attribute names and the annotated text spans are the corresponding attribute values.
While the Information Extraction library is modular and extensible in order to support new languages and new types of documents, in the InteropEHRate project it was developed to support two languages (French and Italian) and one document type (prescriptions).
It comprises of two main components, the Prescription NLP Tool and SCROLL.

# Prescription NLP Tool
This tool is extended to support two languages ,italian and french, from an exisiting project.
It uses trained BERT models in the specified langauges to support the task of Named Entity Recognition. 
The datasets used for training the models are annotated in the semi-automated manner for both the languages and thus can be extended to any number in the future. 

# SCROLL Health
This is another component used in the Information Extraction tasks and have specific extended functionalities for Italian and French. 
It uses the health-domain specific ,in particular Prescription, NLP pipelines for parsing the language of data, within an integrated framework.

 



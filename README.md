# health-services

This repository stores the the source of the InteropEHRate Health Service (IHS) component.

The IHS is developed in NodeJS, so a NodeJS environment has to be instelled and set up in the deployment machine.

To facilitate the deployment, installation and execution of the IHS component, a docker image has been created, which can be found in "docker-images/ihs-2-9.tar.gz". Due to that a docker and docker-compose environments have to be installed in the deployment machine.

The docker-compose.yml file lists inside the different container used by the IHS. Here below a brief description of the containers, how to access the required docker images and other instruction required for the correct installation of the IHS.

### mongodb

This container installs and set up a mongoDB instance, used to register the IHS users.

The installation and set up of this container automatically obtain the monogDB docker image from the web, if an Internet connection is available, the docker image needs to be uploaded manually in the deployment machine otherwise. 

### db

This container installs and set up the IHS postgreSQL database.

The docker image required by this container can be requested to Univeristy of Trento contacting simone.bocca@unitn.it or gabor.bella@unitn.it

This container requires a dump.sql file for the database initialization. Also the dump.sql file can be request to Univeristy of Trento contacting the same reference persons.

### sweb

This container installs and set up the knowledge and data integration platform used by the IHS component. 

The docker image required by this container can be requested to Univeristy of Trento contacting simone.bocca@unitn.it or gabor.bella@unitn.it

### kos 

This container installs and set up the knowledge management tool exploited by the IHS.

The docker image required by this container can be requested to Univeristy of Trento contacting simone.bocca@unitn.it or gabor.bella@unitn.it

### karmalinker

This container installs and set up the data mapping tool exploited by the IHS.

The docker image required by this container is available in "docker-images/karmalinker-2-5-KL2-2-4-r1.targ.gz"

### converter

This container installs and set up an IHS sub component, required for data conversion.

The docker image required by this container is available in "docker-images/converter-iehr.tar.gz"

### ihs

This container installs and set up the main IHS application.

The docker image required by this container is available in "docker-images/ihs-2-9.tar.gz"

### nlptool

TO BE COMPLETED

### -------------------------------------------------------------------------------------------------------------------------------------------------


To run the IHS component, you have to download and upload all the required docker images (and dump.sql file) in the deployment machine.

Then run the following command in the same folder where the docker-compose.yml file is stored.

#docker-compose up


package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.model.NLText;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import static it.unitn.disi.sweb.core.nlp.pipelines.SCROLLPipeline.PARAGRAPH_DELIMITER;

public class IETool {

    private final Logger logger = LoggerFactory.getLogger(IETool.class);

    //private static String TOOL_DELIMITER = "\\u00a4";

    public ArrayList<IEDataType> InformationExtractionTool(NLText nlText,String URL_IOB ) {
        logger.info("In the IETool class");

        ArrayList<IEDataType> toolOutputCatch = new ArrayList<IEDataType>();
        IEDataType ieDataTypeCatch = new IEDataType();

        //step 1 : prepare the json input with text, model
        String language = nlText.getLanguage();

        //to add the . required by the tool
        if(!nlText.getText().endsWith("."))
        {
            nlText.setText(nlText.getText()+".");
        }

        String Prescription = nlText.getText();
        String model_choice_IOB = language+"-bert";

        String jsonBodyIOB = new JSONObject()
                .put("ehr_text", Prescription)
                .put("model_choice", model_choice_IOB)
                .toString();

        //Step 2 : call the tool using the prepared json
        Connection.Response execute = null;

        try {
            execute = Jsoup.connect(URL_IOB)
                    .timeout(3000000)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .userAgent("Mozilla")
                    .requestBody(jsonBodyIOB)
                    .method(Connection.Method.POST)
                    .ignoreContentType(true)
                    .execute();
        }
        catch(Exception e)
        {
            System.out.println("In the exception block");
            String notAnnotated[] = nlText.getText().split(PARAGRAPH_DELIMITER);
            for(String text:notAnnotated)
            {
                ieDataTypeCatch.setText(text);
                ieDataTypeCatch.setStartIndex(0);
                ieDataTypeCatch.setEndIndex(0);
                toolOutputCatch.add(ieDataTypeCatch);
            }
            return toolOutputCatch;
        }

        String responseJson = execute.body();

        //Step 3 : process the response
        Document doc = Jsoup.parse(responseJson);

        //Prescription = jsonBodyIOB.substring(13,jsonBodyIOB.length()-32);
        List<String> responseData = new ArrayList<String>(Arrays.asList(doc.body().text().split("],"))); //contains only the annotation,start index and end index

 /*       String last = responseData.get(responseData.size()-1); //the string with text and annotation distinguished only by space
        List<String>  splits;
        /*if(nlText.getText().contains(PARAGRAPH_DELIMITER))
            splits = new ArrayList<String>(Arrays.asList(last.split(PARAGRAPH_DELIMITER)));
        else */
     /*    splits = new ArrayList<String>(Arrays.asList(last.split("\\¤")));  // change the char options : ¤


       String[] indiciesFirst = myList.get(0).split(",");
        int startFirst = Integer.valueOf(indiciesFirst[1]);
        int endFirst = 0;
        try{
            endFirst = Integer.valueOf(indiciesFirst[2]);
        }catch (Exception e)
        {
            endFirst = Integer.valueOf(indiciesFirst[2].substring(0,indiciesFirst[2].length()-1));
        }

        if(startFirst>1)
            toolOutput.add(new IEDataType(splits.get(0).substring(15,15+startFirst-1),0,startFirst-1));

        toolOutput.add(new IEDataType(splits.get(0).substring(15+startFirst),startFirst,endFirst));

        for(int i=1;i<splits.size()-1;i++)
        {
            IEDataType ieDataType = new IEDataType();

            //for the case where the text is not annotated
            if(!splits.get(i).toLowerCase().contains(myList.get(i).toLowerCase().substring(2,4)))
            {
                System.out.println("in the splits where text is not annotated:" + splits.get(i));
                int s = toolOutput.get(toolOutput.size()-1).endIndex+1;
                int e = toolOutput.get(toolOutput.size()-1).endIndex+1+splits.get(i).trim().lastIndexOf(" ");
                // final_tokens.add(splits.get(i));
                if(splits.get(i).lastIndexOf(" ")>(e-s))
                {
                    String rem1 = splits.get(i).substring(0,splits.get(i).lastIndexOf(" ")-(e-s)-1);
                    toolOutput.add(new IEDataType(rem1,s-rem1.length()-1,s-1));
                    //if the first element is not annotated and contains the paragraph delimiter
                    if(splits.get(i).contains(PARAGRAPH_DELIMITER))
                        toolOutput.add(new IEDataType(PARAGRAPH_DELIMITER,s,s+1));
                }
          *//*      //if this element begins with PARAGRAPH DELIMITER
                if(splits.get(i).trim().substring(splits.get(i).lastIndexOf(" ")-(e-s)).contains(PARAGRAPH_DELIMITER))
                    toolOutput.add(new IEDataType(PARAGRAPH_DELIMITER,s-2,s-1));*//*

                toolOutput.add(new IEDataType(splits.get(i).trim().substring(splits.get(i).lastIndexOf(" ")-(e-s)),s,e));
                continue;
            }

            //in case the text is annotated
            String[] indicies = myList.get(i).split(",");
            int start = Integer.valueOf(indicies[1]);
            int end = 0;
            try{
                end = Integer.valueOf(indicies[2]);
            }catch (Exception e)
            {
                end = Integer.valueOf(indicies[2].substring(0,indicies[2].length()-1));
            }

            //int a = myList.get(i).indexOf(",",0);
            String a_text = splits.get(i);
            if(a_text.startsWith(" ")|a_text.startsWith("\\w"))
                a_text=a_text.substring(1);
            if(a_text.matches("[a-z]+,[a-z]+,")|a_text.matches("[a-z]+,[a-z]+,[a-z]+]"))
            {
                //the string without annotation but is in the same string as annotated text
                //ex: Da valutare gliflozine in accordo con il Diabetologo di riferimento,Sospendere nimotop, Clopidogrel (Clopidogrel krka) Drug
                //final_tokens.add(a_text.substring(0,a_text.lastIndexOf(",")));
                a_text = a_text.substring(a_text.lastIndexOf(","));
            }

            //int lastindex = myList.get(i).lastIndexOf(",")+1;
            if(a_text.lastIndexOf(" ")>(end-start) & !a_text.startsWith("("))
            {
                String rem = a_text.substring(0,a_text.lastIndexOf(" ")-(end-start)-1);
                *//*if(a_text.startsWith(" "))
                    toolOutput.add(new IEDataType(rem,start-rem.length()-1,start-1));
                else*//*
                toolOutput.add(new IEDataType(rem,start-rem.length()-1,start-1)); //test
                a_text=a_text.substring(a_text.lastIndexOf(" ")-(end-start));
            }

            if(myList.get(i).contains("]"))
            {
                ieDataType.setText(a_text);
                ieDataType.setStartIndex(start);
                ieDataType.setEndIndex(end);
                toolOutput.add(ieDataType);
            }
            else
            {
                ieDataType.setText(a_text);
                ieDataType.setStartIndex(start);
                ieDataType.setEndIndex(end);
                toolOutput.add(ieDataType);
            }
        }

        //text which is not annotated at the end of the input string
        int length = nlText.getText().length();
        int lastList = toolOutput.get(toolOutput.size()-1).endIndex;
        if(length-lastList>1)
        {
            toolOutput.add(new IEDataType(nlText.getText().substring(lastList+1),lastList+1,length));
        }*/
       // IEDataType ieDataType = new IEDataType();
        ArrayList<IEDataType> toolOutput = new ArrayList<IEDataType>();

        JSONObject jsonObject = new JSONObject(responseJson);
        JSONArray tsmresponse = (JSONArray) jsonObject.get("index_entity");
        String annotation;

        for(int i=0; i<tsmresponse.length(); i++){

            annotation = Objects.toString(tsmresponse.get(i), null);
            String[] temp = annotation.split(",");
            String text = nlText.getText().substring(Integer.valueOf(temp[1]),Integer.valueOf(temp[2].substring(0,temp[2].length()-1))) +" "+ temp[0].substring(2,temp[0].length()-1);
            int start = Integer.valueOf(temp[1]);
            int end = Integer.valueOf(temp[2].substring(0,temp[2].length()-1));
            //System.out.println("text in tool: " + text + "start");

            //To be tested
            if(text.contains(PARAGRAPH_DELIMITER))
            {
                String[] parts = text.split(PARAGRAPH_DELIMITER);

                int offset = 0;
                for(String part:parts)
                {
                    if(part.isEmpty())
                        toolOutput.add(new IEDataType(text.substring(0,1),start,start+1));
                    else
                    {
                        int buffer = 0; //the remove the length of the entity
                        if(part.substring(part.lastIndexOf(" ")+1).matches(("\\s*[A-Z]+")))
                            buffer = part.substring(part.lastIndexOf(" ")+1).length();
                        //System.out.println("part annotated: " + part + "buffer: " + buffer);
                        toolOutput.add(new IEDataType(part,start+offset-buffer,start+part.length()+offset-buffer));
                        if(!part.equals(parts[parts.length-1]))
                            toolOutput.add(new IEDataType(PARAGRAPH_DELIMITER,start+part.length()+offset-buffer,start+part.length()+offset+1-buffer));

                        offset = offset + part.length();
                    }
                }
                if(text.endsWith(PARAGRAPH_DELIMITER))
                    toolOutput.add(new IEDataType(String.valueOf(text.charAt(text.lastIndexOf(PARAGRAPH_DELIMITER))),end-1,end));
            }
            else
                toolOutput.add(new IEDataType(text,start,end));
        }

        for(int j=0;j<toolOutput.size();j++)
        {
            //if the first element is not annotated and contains the delimiter
            if((toolOutput.get(j).startIndex>0) && (j==0))
            {   //System.out.println("first if" +toolOutput.get(0).startIndex + toolOutput.get(0).text);

                if(nlText.getText().substring(0,toolOutput.get(0).startIndex).contains(PARAGRAPH_DELIMITER))
                {//TODO
                    //System.out.println("in the first if=" + nlText.getText().substring(0,toolOutput.get(0).startIndex));
                    String text = nlText.getText().substring(0,toolOutput.get(0).startIndex);
                    String[] parts = text.split(PARAGRAPH_DELIMITER);
                    //System.out.println("part 0 =" + parts[0]+", part 1 =" + parts[1]);

                    toolOutput.add(j,new IEDataType(parts[0],0,parts[0].length()));
                    toolOutput.add(j+1,new IEDataType(PARAGRAPH_DELIMITER,parts[0].length(),parts[0].length()+1));
                    toolOutput.add(j+2,new IEDataType(parts[1],parts[0].length()+1,parts[0].length()+1+parts[1].length()));
                    if(parts.length>2)
                    {
                        toolOutput.add(j+3,new IEDataType(PARAGRAPH_DELIMITER,parts[0].length()+1+parts[1].length(),parts[0].length()+1+parts[1].length()+1));
                        toolOutput.add(j+4,new IEDataType(parts[2],parts[0].length()+1+parts[1].length()+1,parts[0].length()+1+parts[1].length()+1+parts[2].length()));
                        j = j + 4;
                    }
                    else
                        j= j + 2;
                }
                else
                    toolOutput.add(0,new IEDataType(nlText.getText().substring(0,toolOutput.get(0).startIndex-1),0,toolOutput.get(0).startIndex-1));

                continue;
            }
            try{
                //text which is not annotated

                if(Math.abs(toolOutput.get(j+1).startIndex-toolOutput.get(j).endIndex) > 1)
                {
                    //not annotated text contains the delimiter. ex:
                    if(nlText.getText().substring(toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex).contains(PARAGRAPH_DELIMITER))
                    {

                        String temp = nlText.getText().substring(toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex);
                        // System.out.println("temp: " + temp);
                        int offset = 0,rem =0 ;
                        String[] parts = nlText.getText().substring(toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex).split(PARAGRAPH_DELIMITER);
                        //System.out.println("length:" + parts.length + "text:" + temp);
                        //TO DO : find the char ....

                        for(String part:parts)
                        {
                            if(part.isEmpty())
                            {
                                toolOutput.add(j+1,new IEDataType(temp.substring(0,1),toolOutput.get(j).endIndex,toolOutput.get(j).endIndex+1));
                                j = j + 1;
                            }
                            else
                            {
                                //   System.out.println("part: " + part);

                                toolOutput.add(j+1,new IEDataType(part,toolOutput.get(j).endIndex+offset,toolOutput.get(j).endIndex+part.length()+offset));
                                toolOutput.add(j+2,new IEDataType(temp.substring(offset-1,offset),toolOutput.get(j).endIndex+part.length()+offset,toolOutput.get(j).endIndex+part.length()+1+offset));
                                offset = offset + part.length();
                                j = j + 2;
                            }
                            //j = j + rem;
                        }
                        if(temp.endsWith(PARAGRAPH_DELIMITER))
                        { // System.out.println("in the if : " + temp.substring(temp.length()-1));

                            toolOutput.add(j+1,new IEDataType(temp.substring(temp.length()-1),toolOutput.get(j).endIndex+temp.length()-1,toolOutput.get(j).endIndex+temp.length()));
                            j = j + 1;
                        }

                    }
                    //there is no delimiter in the text which is not annotated. ex:
                    else
                    {
                        // System.out.println("in the else : " + nlText.getText().substring(toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex-1));
                        toolOutput.add(j+1,new IEDataType(nlText.getText().substring(toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex-1),toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex-1));
                        j = j + 1;
                    }
                    continue;
                }

                //if paragraph delimiter exists between the two subsequent elements
                if(nlText.getText().substring(toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex).contains(PARAGRAPH_DELIMITER))
                    toolOutput.add(j+1,new IEDataType(PARAGRAPH_DELIMITER,toolOutput.get(j).endIndex,toolOutput.get(j+1).startIndex));

            }catch (Exception e)
            { //System.out.println("in the catch block");
                continue;
            }
        }

        for(int k=0;k<toolOutput.size();k++)
        {
            if(k!=toolOutput.size()-1)
                if(toolOutput.get(k).text==toolOutput.get(k+1).text)
                    toolOutput.remove(k);
            if(toolOutput.get(k).text.matches("\\s*"))
                toolOutput.remove(k);

            //  System.out.println("tool output:" + toolOutput.get(k).text + " start=" + toolOutput.get(k).startIndex + " end=" + toolOutput.get(k).endIndex);
        }
        return toolOutput;
    }
}

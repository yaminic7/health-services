package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.model.NLText;
import it.unitn.disi.sweb.core.nlp.parameters.NLPParameters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static it.unitn.disi.sweb.core.nlp.pipelines.SCROLLPipeline.PARAGRAPH_DELIMITER;

@Service("PrescriptionIEFra")
public class PrescriptionIEFra<T extends NLPParameters> extends PrescriptionIE<T> {
    private final Logger logger = LoggerFactory.getLogger(PrescriptionIEFra.class);

    @Override
    public ArrayList<IEDataType> postProcess(ArrayList<IEDataType> toolOutput)
    {
        //toolOutput = super.postProcess(toolOutput);
        logger.info("In the PrescriptionIEFra class");

        for(int i=0;i<toolOutput.size();i++)
        {
            //   if((toolOutput.get(i).text.startsWith("(")| toolOutput.get(i).text.startsWith(" (")) & (toolOutput.get(i).text.endsWith(")")|toolOutput.get(i).text.endsWith(" )")))
            //if(toolOutput.get(i).text.matches("\\s\\(\\s[a-z]+ [0-9]+\\) [A-Za-z]+$")|toolOutput.get(i).text.matches(" \\(\\s[a-z]+ [0-9]+-[0-9]+\\) [A-Za-z]+$")|toolOutput.get(i).text.matches("\\([A-Za-z]+\\s*-*\\s*[A-Za-z]*\\s*-*\\s*[A-Za-z]*\\) [A-Za-z]+$")|toolOutput.get(i).text.matches("\\([a-z]+ [0-9]+\\)\\s[A-Za-z]+$"))
            if((toolOutput.get(i).text.contains(" NOTE")|toolOutput.get(i).text.contains("NOTE")|toolOutput.get(i).text.contains("  NOTE"))&& (toolOutput.get(i).text.matches("\\(.*\\)[,;.:]*\\s*.*")))
            {
                if(toolOutput.get(i).text.matches("\\(.*\\)[,;.:]+\\s*.*"))

                {
                    toolOutput.get(i).setStartIndex(toolOutput.get(i).startIndex+1);
                    toolOutput.get(i).setEndIndex(toolOutput.get(i).endIndex-2);
                }
                else
                {
                    toolOutput.get(i).setStartIndex(toolOutput.get(i).startIndex+1);
                    toolOutput.get(i).setEndIndex(toolOutput.get(i).endIndex-1);
                }
            }
        }
        ArrayList<IEDataType> postSplit = splitAnnotations(toolOutput);
        ArrayList<IEDataType> postSplit2 = super.postProcess(postSplit);

        return postSplit2;
    }

    private ArrayList<IEDataType> splitAnnotations(ArrayList<IEDataType> postProcessLang)
    {
        logger.info("splitting the text and retrive only annotation (text can be used when required based on the indicies)");
        //for the final list to be returned
        ArrayList<IEDataType> newPrescriptionList = new ArrayList<>();
        for(int i =0;i<postProcessLang.size();i++)
        {
            ArrayList<String> AnnotationTags = new ArrayList<String>(
                    Arrays.asList(" DRUG", " STR"," FOR"," DOS"," FRE"," NOTE", " STOP"));

            String entity ="";
            String textAnnotation ="";
            //System.out.println(postProcessLang.get(i).text);
            try{
                entity = postProcessLang.get(i).text.substring(postProcessLang.get(i).text.lastIndexOf(" "));
                textAnnotation = postProcessLang.get(i).text.substring(0,postProcessLang.get(i).text.lastIndexOf(" "));
                textAnnotation = textAnnotation.trim();

            }catch (Exception e)
            {
                entity = "Not annotated";
            }

            // System.out.println("annotation before splitting:" + postProcessLang.get(i).text);
            if(AnnotationTags.contains(entity))
            {
                if(entity.contains("DRUG")&&!(entity.contains("StopDrug"))) //drug ingredient and drug product
                {
                    String[] drug_components;
                    if((textAnnotation.contains(" (")|textAnnotation.contains("(")) && (textAnnotation.contains(" )")|textAnnotation.contains(")")))
                    {
                        drug_components = textAnnotation.split("\\("); //maybe include limit
                        String drug_ingredient=drug_components[0];
                        drug_ingredient = drug_ingredient.trim();
                        drug_ingredient = drug_ingredient.replace(", ",",");
                        String product_name=drug_components[1];
                        product_name = product_name.trim();

                        newPrescriptionList.add(new IEDataType(drug_ingredient+" DrugIngredient",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+drug_ingredient.length()));

                        if(drug_ingredient.startsWith(",") | drug_ingredient.contains(",") | drug_ingredient.startsWith(".") )
                            newPrescriptionList.add(new IEDataType("("+product_name + " DrugProduct",postProcessLang.get(i).startIndex+drug_ingredient.length()+1,postProcessLang.get(i).startIndex+drug_ingredient.length()+product_name.length()));
                        else
                            newPrescriptionList.add(new IEDataType("("+product_name + " DrugProduct",postProcessLang.get(i).startIndex+drug_ingredient.length()+2,postProcessLang.get(i).startIndex+drug_ingredient.length()+product_name.length()+1));
                    }
                    else //no products
                    {
                        if(textAnnotation.startsWith(","))
                        {
                            newPrescriptionList.add(new IEDataType(textAnnotation+" DrugIngredient",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                            newPrescriptionList.add(new IEDataType(textAnnotation+" DrugProduct",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                        }
                        else
                        {
                            newPrescriptionList.add(new IEDataType(textAnnotation+" DrugIngredient",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                            newPrescriptionList.add(new IEDataType(textAnnotation+" DrugProduct",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                        }
                    }
                }
                else if(entity.contains("STR")) //strength value, strength unit
                {
                    if(textAnnotation.matches(".*\\)"))
                        postProcessLang.get(i).setEndIndex(postProcessLang.get(i).endIndex-1);

                    String[] strength = new String[0];
                    String[] strengthOnly = new String[0];
                    String strengthValueOnly = "";
                    if(!textAnnotation.contains(" "))
                    {   //in case the strength is as 75mg
                        if(textAnnotation.matches("[0-9]+[a-z]+"))
                            //strength = textAnnotation.split("\\s*[0-9]+\\s*");
                            strength = textAnnotation.split("(?<=\\d)(?=\\D)");
                        else if(textAnnotation.matches(" .* [0-9]+]"))
                            strengthOnly = textAnnotation.split("[0-9]+]");
                            //in case of the strength 75
                        else
                            strengthValueOnly = textAnnotation;
                    }
                    //when there is no space in strength
                    else
                    {
                        if(textAnnotation.matches(" .* [0-9]+]"))
                            strengthOnly = textAnnotation.split("[0-9]+");
                        else if(textAnnotation.matches("[0-9]+[a-z]+"))
                            //strength = textAnnotation.split("\\s*[0-9]+\\s*");
                            strength = textAnnotation.split("(?<=\\d)(?=\\D)");
                        else
                            strength = textAnnotation.split("\\s");
                    }
                    try {
                        strength[1] = strength[1].trim();

                        newPrescriptionList.add(new IEDataType(strength[0]+" StrengthValue",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+strength[0].length()));
                        newPrescriptionList.add(new IEDataType(strength[1]+" StrengthUnit",postProcessLang.get(i).startIndex+strength[0].length(),postProcessLang.get(i).startIndex+strength[0].length()+1+strength[1].length()));
                    }catch (Exception e)
                    {
                        //example:  3.75 Strength (strength value and unit are same) or even for the case as 2 puff
                        if(strengthOnly.length==0)
                        {
                            newPrescriptionList.add(new IEDataType(strengthValueOnly+" StrengthValue",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                           // newPrescriptionList.add(new IEDataType(" StrengthUnit",0,0));
                        }
                        else
                        {
                            newPrescriptionList.add(new IEDataType(strengthOnly[1]+" StrengthValue",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                            //newPrescriptionList.add(new IEDataType(" StrengthUnit",0,0));
                        }
                    }
                }

                //to correct in case it dosage contains form as well
                else if(entity.contains("DOS"))
                {
                    if(textAnnotation.matches("[0-9]+[a-z]+") | textAnnotation.matches("[0-9]+\\/[0-9]+[a-z]+"))
                    {   int ch = textAnnotation.indexOf('c');
                        newPrescriptionList.add(new IEDataType(textAnnotation.substring(0,ch) + " Dosage",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+textAnnotation.substring(0,ch).length()));
                        if(textAnnotation.substring(ch-1).contains("x"))
                        {
                            int x = textAnnotation.indexOf('x');
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(ch-1,x) + " Form",postProcessLang.get(i).startIndex+textAnnotation.substring(0,ch).length()+textAnnotation.substring(ch-1,x).length(),postProcessLang.get(i).endIndex-textAnnotation.substring(x).length()));
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(x)+" Frequency",postProcessLang.get(i).endIndex-textAnnotation.substring(x).length()+1,postProcessLang.get(i).endIndex));
                            //newPrescriptionList.add(new IEDataType(" PeriodUnit",0,0));
                        }
                        //does not contain x
                        else
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(ch) + " Form",postProcessLang.get(i).endIndex-textAnnotation.substring(ch).length(),postProcessLang.get(i).endIndex));
                    }
                    else
                        newPrescriptionList.add(new IEDataType(textAnnotation+ " Dosage",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                }

                //Note, Stop Drug, Form
                else if(entity.contains("FOR"))
                    newPrescriptionList.add(new IEDataType(textAnnotation+ " Form",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                else if(entity.contains("FRE")) //frequency, periodUnit
                {

                    if(textAnnotation.contains("/") | textAnnotation.contains(" /"))
                    {
                        String[] partial_frequency1;
                        try{
                            partial_frequency1 = new String[]{textAnnotation.substring(0, textAnnotation.lastIndexOf("/")-1), textAnnotation.substring(textAnnotation.lastIndexOf("/"))};
                            newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].length()));
                            newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" PeriodUnit",postProcessLang.get(i).startIndex+1+partial_frequency1[0].length()+1,postProcessLang.get(i).endIndex));

                        }catch (Exception e)
                        {   //frequency is not /jour or /j or /sem /semaine or /moir...
                            //ex: 2sem or 2j
                            if(textAnnotation.substring(1).matches("[0-9]+.*"))
                            {
                                newPrescriptionList.add(new IEDataType(textAnnotation.substring(1,2)+" Frequency",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).startIndex+2));
                                newPrescriptionList.add(new IEDataType(textAnnotation.substring(2)+" PeriodUnit",postProcessLang.get(i).startIndex+2,postProcessLang.get(i).endIndex));
                            }
                            else
                                newPrescriptionList.add(new IEDataType(textAnnotation.substring(1)+" PeriodUnit",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                        }
                    }
                    else if(textAnnotation.contains("par") | textAnnotation.contains(" par"))
                    {
                        String[] partial_frequency1;
                        try{
                            partial_frequency1 = textAnnotation.split("par");
                            if(partial_frequency1[0].contains("x"))
                                newPrescriptionList.add(new IEDataType(partial_frequency1[0].substring(0,partial_frequency1[0].indexOf("x"))+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].substring(0,partial_frequency1[0].indexOf("x")).length()));
                            else
                                newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].length()));
                            newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" PeriodUnit",postProcessLang.get(i).startIndex+1+partial_frequency1[0].length()+2,postProcessLang.get(i).endIndex));

                        }catch (Exception e)
                        {   //frequency is not /jour or /j or /sem /semaine or /moir... par
                            //newPrescriptionList.add(new IEDataType(" Frequency",0,0));
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(1)+" PeriodUnit",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                        }
                    }
                    else if(textAnnotation.contains("semaines") && !textAnnotation.contains(")"))
                    {
                        String[] partial_frequency1;
                        try{
                            partial_frequency1 = textAnnotation.split(" ");

                            newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].length()));
                            newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" PeriodUnit",postProcessLang.get(i).startIndex+1+partial_frequency1[0].length(),postProcessLang.get(i).endIndex));

                        }catch (Exception e)
                        {   //frequency is not /jour or /j or /sem /semaine or /moir... par
                            //newPrescriptionList.add(new IEDataType(" Frequency",0,0));
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(1)+" PeriodUnit",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                        }
                    }
                    else
                    {
                        if(textAnnotation.matches(".*[x].*"))
                        {
                            if(textAnnotation.equals("x")|textAnnotation.equals(" x")|textAnnotation.equals("x ")|textAnnotation.equals(" x "))
                                continue;
                            //int x = textAnnotation.indexOf('x');
                            String[] partial_frequency1 = textAnnotation.split("x");
                            newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].length()));
                            if(partial_frequency1.length>1)
                                newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" PeriodUnit",postProcessLang.get(i).startIndex+partial_frequency1[0].length(),postProcessLang.get(i).endIndex));
                        }
                        //no x but only a number
                        else
                        {
                            newPrescriptionList.add(new IEDataType(textAnnotation+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+textAnnotation.length()));
                            //newPrescriptionList.add(new IEDataType(" PeriodUnit",0,0));
                        }
                    }
                }
                else if(entity.contains("STOP"))
                    newPrescriptionList.add(new IEDataType(textAnnotation+ " StopDrug",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));

            else if(entity.contains("NOTE"))
            {
                //System.out.println("in the note if-else : "  + textAnnotation);
                if(textAnnotation.contains(PARAGRAPH_DELIMITER))
                {
                    String[] parts = textAnnotation.split(PARAGRAPH_DELIMITER);
                    newPrescriptionList.add(new IEDataType(parts[0] + " Note",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+parts[0].length()));
                    newPrescriptionList.add(new IEDataType(PARAGRAPH_DELIMITER+" PARAGRAPH_DELIMITER",postProcessLang.get(i).startIndex+parts[0].length(),postProcessLang.get(i).startIndex+parts[0].length()+1));
                    newPrescriptionList.add(new IEDataType(parts[1] + " Note",postProcessLang.get(i).endIndex-parts[1].length(),postProcessLang.get(i).endIndex));
                }
                newPrescriptionList.add(new IEDataType(textAnnotation+ " Note",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
            }
            }
            //entities not detected
            else
            {
               // System.out.println("the text and indicies = " + postProcessLang.get(i).text + " : "+postProcessLang.get(i).startIndex + " : " +postProcessLang.get(i).endIndex);
                if(postProcessLang.get(i).text.contains(PARAGRAPH_DELIMITER) && postProcessLang.get(i).text.length()>2)
                {
                    String[] parts = textAnnotation.split(PARAGRAPH_DELIMITER);
                    try{
                    //    System.out.println("the parts 0 = " + parts[0] );

                        if(!parts[0].matches(PARAGRAPH_DELIMITER) && !parts[0].matches("\\s+"))
                            newPrescriptionList.add(new IEDataType(parts[0] + " ",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+parts[0].length()));

                        newPrescriptionList.add(new IEDataType(PARAGRAPH_DELIMITER+" PARAGRAPH_DELIMITER",postProcessLang.get(i).startIndex+parts[0].length(),postProcessLang.get(i).startIndex+parts[0].length()+1));

                        if(!parts[1].matches(PARAGRAPH_DELIMITER) && !parts[1].matches("\\s+"))
                            newPrescriptionList.add(new IEDataType(parts[1] + " ",postProcessLang.get(i).endIndex-parts[1].length(),postProcessLang.get(i).endIndex));

                      //  System.out.println("the parts  1= " + parts[1] );

                    }catch (Exception e)
                    {}
                }
                //contains only the paragraph delimiter
                if(postProcessLang.get(i).text.matches(PARAGRAPH_DELIMITER))
                    newPrescriptionList.add(new IEDataType(postProcessLang.get(i).text+" PARAGRAPH_DELIMITER",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));

                if(!(postProcessLang.get(i).text.isEmpty()| postProcessLang.get(i).text.contains(PARAGRAPH_DELIMITER)| postProcessLang.get(i).text.matches(" ")| postProcessLang.get(i).text.matches("\\w")| postProcessLang.get(i).text.equals(",") | postProcessLang.get(i).text.equals("+")  | postProcessLang.get(i).text.equals("-") | postProcessLang.get(i).text.equals(":")))
                {
                    //System.out.println("the text and indicies in the last if = " + postProcessLang.get(i).text + " : "+postProcessLang.get(i).startIndex + " : " +postProcessLang.get(i).endIndex);

                    newPrescriptionList.add(new IEDataType(postProcessLang.get(i).text + " ",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                }
            }
        }

   /*     for(int t = 0; t<newPrescriptionList.size(); t++)
               System.out.println("test: " + newPrescriptionList.get(t).text + " start = " + newPrescriptionList.get(t).startIndex + " end =" + newPrescriptionList.get(t).endIndex);
*/
        return newPrescriptionList;
    }
}

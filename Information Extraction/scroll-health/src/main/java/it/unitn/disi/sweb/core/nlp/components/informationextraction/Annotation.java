package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Annotation {
    int startIndex;
    int endIndex;
    ArrayList<String> tags = new ArrayList<String>();
    String relation;

    public Annotation() {
    }

    public Annotation(int startIndex,int endIndex,ArrayList<String> tags)
    {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.tags = tags;
    }
    public void setStartIndex(int startIndex){
        this.startIndex = startIndex;
    }
    public void setEndIndex(int endIndex){
        this.endIndex = endIndex;
    }
    public void setTags(ArrayList<String> tags){
        this.tags=tags;
    }
    public void addTag(String tag){
        getTags().add(tag);
    }

    public int getStartIndex(){
        return this.startIndex;
    }
    public int getEndIndex(){
        return this.endIndex;
    }
    public List<String> getTags(){
        return this.tags;
    }
    public void setRelation(String relationName)
    { this.relation = relationName; }
    public String getRelation()
    {
        return this.relation;
    }



}

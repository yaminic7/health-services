package it.unitn.disi.sweb.core.nlp.components.informationextraction;

//change it to IEData
public class IEDataType {
    String text;
    int startIndex;
    int endIndex;

    public IEDataType(String text,int startIndex,int endIndex) {
        this.text = text;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }

    public void setText(String text)
    {
        this.text=text;
    }
    public String getText(int startIndex,int endIndex)
    {
        return text;
    }
    public void setStartIndex(int startIndex)
    {
        this.startIndex = startIndex;
    }
    public void setEndIndex(int endIndex)
    {
        this.endIndex = endIndex;
    }

    IEDataType() {

    }
}

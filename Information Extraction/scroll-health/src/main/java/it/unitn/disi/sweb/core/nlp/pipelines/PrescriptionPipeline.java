package it.unitn.disi.sweb.core.nlp.pipelines;

import it.unitn.disi.sweb.core.nlp.components.informationextraction.IInformationExtraction;
import it.unitn.disi.sweb.core.nlp.components.languagedetectors.ILanguageDetector;
import it.unitn.disi.sweb.core.nlp.parameters.NLPParameters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/**
 * Pipeline for Prescription Information extraction from text.
 *
 * @author Yamini Chandrashekar, yamini.chandrashekar@unitn.it
 * @param <T> The parameters type
 */
@Service(PrescriptionPipeline.QUALIFIER)
public class PrescriptionPipeline<T extends NLPParameters> extends SCROLLPipeline<T> {

    /**
     * The pipeline qualifier
     */
    public static final String QUALIFIER = "PrescriptionPipeline";

    @Autowired
    @Qualifier("PrescriptionIE")
    private IInformationExtraction<T> PrescriptionIE;

    /**
     * Instantiates a new pipeline setting the given parameters (defaulted to an autowired
     * {@link NLPParameters}).
     *
     * @param parameters The parameters that will be used by the pipeline
     */
    @Autowired
    public PrescriptionPipeline(@Qualifier("NLPParameters") T parameters)
    {
        super(parameters);
    }

    @Override
    public String getName()
    {
        return QUALIFIER;
    }

    @Override
    protected void init() {
        //addComponent(languageDetector);
        getParameters().setProcessStringsIndependently(false);

        addComponent(PrescriptionIE);
        getParameters().setUseAdaptiveProcessing(false);
        getParameters().setUseFastLemmatization(false);
    }
}

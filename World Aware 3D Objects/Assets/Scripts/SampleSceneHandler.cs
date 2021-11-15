using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Siccity.GLTFUtility;

public class SampleSceneHandler : MonoBehaviour
{
    public string filepath;

    // Start is called before the first frame update
    void Start()
    {
        //load model
        // Single thread
        GameObject result = Importer.LoadFromFile(filepath);

        

    }

    // Update is called once per frame
    void Update()
    {
        
    }
}

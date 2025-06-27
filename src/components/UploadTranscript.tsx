
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UploadTranscript = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prospectName, setProspectName] = useState("");
  const [contactName, setContactName] = useState("");
  const [callType, setCallType] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = ['.txt', '.docx', '.vtt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .docx, or .vtt file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "File uploaded successfully",
      description: `${file.name} is ready for analysis`
    });
    console.log("File uploaded:", file.name, "Size:", file.size, "Type:", file.type);
  };

  const handleAnalyze = () => {
    if (!uploadedFile || !prospectName || !contactName) {
      toast({
        title: "Missing information",
        description: "Please upload a file and fill in the prospect and contact details",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call for analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis complete!",
        description: "Your call has been analyzed. Check the results tab."
      });
    }, 3000);

    console.log("Starting analysis for:", {
      file: uploadedFile.name,
      prospect: prospectName,
      contact: contactName,
      callType,
      notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Call Transcript</span>
          </CardTitle>
          <CardDescription>
            Upload your sales call transcript for AI-powered Challenger methodology analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-blue-500 bg-blue-50" 
                : "border-slate-300 hover:border-slate-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-slate-500" />
              </div>
              
              {uploadedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">File uploaded successfully</span>
                  </div>
                  <p className="text-slate-600">{uploadedFile.name}</p>
                  <Badge variant="secondary">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your transcript here</p>
                  <p className="text-slate-600">or click to browse files</p>
                  <div className="flex justify-center space-x-2">
                    <Badge variant="outline">.txt</Badge>
                    <Badge variant="outline">.docx</Badge>
                    <Badge variant="outline">.vtt</Badge>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                className="hidden"
                accept=".txt,.docx,.vtt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                id="file-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
          <CardDescription>
            Provide context about the sales call for better analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prospect">Prospect Company *</Label>
              <Input
                id="prospect"
                placeholder="e.g., Acme Corporation"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Name *</Label>
              <Input
                id="contact"
                placeholder="e.g., John Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="call-type">Call Type</Label>
            <Select value={callType} onValueChange={setCallType}>
              <SelectTrigger>
                <SelectValue placeholder="Select call type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discovery">Discovery Call</SelectItem>
                <SelectItem value="demo">Product Demo</SelectItem>
                <SelectItem value="proposal">Proposal Presentation</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="follow-up">Follow-up Call</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context about the call..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">Ready to Analyze</h3>
              <p className="text-sm text-slate-600">
                Get instant Challenger methodology scoring and coaching insights
              </p>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={!uploadedFile || !prospectName || !contactName || isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze Call
                </>
              )}
            </Button>
          </div>
          
          {(!uploadedFile || !prospectName || !contactName) && (
            <div className="flex items-center space-x-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                Please upload a transcript and fill in the required fields to continue
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadTranscript;

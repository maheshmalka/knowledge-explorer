namespace KnowledgeExplorer.Models;

public class GenerateRequest
{
    public string Topic { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
}

public class GenerateResponse
{
    public string Content { get; set; } = string.Empty;
    public string? Error { get; set; }
}

public class GoogleApiResponse
{
    public Candidate[]? Candidates { get; set; }
    public ErrorDetail? Error { get; set; }
}

public class Candidate
{
    public Content? Content { get; set; }
}

public class Content
{
    public Part[]? Parts { get; set; }
}

public class Part
{
    public string? Text { get; set; }
}

public class ErrorDetail
{
    public string? Message { get; set; }
}

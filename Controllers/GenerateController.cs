using KnowledgeExplorer.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace KnowledgeExplorer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GenerateController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GenerateController> _logger;
    private readonly HttpClient _httpClient;

    public GenerateController(IConfiguration configuration, ILogger<GenerateController> logger, HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
    }

    [HttpPost]
    public async Task<ActionResult<GenerateResponse>> Generate([FromBody] GenerateRequest request)
    {
        if (string.IsNullOrEmpty(request.Topic) || string.IsNullOrEmpty(request.Level))
        {
            return BadRequest(new GenerateResponse { Error = "Topic and level are required" });
        }

        var apiKey = _configuration["GoogleApi:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            return StatusCode(500, new GenerateResponse { Error = "API key not configured" });
        }

        try
        {
            var prompt = $@"Create an educational explanation about ""{request.Topic}"" at a {request.Level} level.

Structure your response as follows:
1. Start with a clear, engaging introduction appropriate for the {request.Level} level
2. Cover 3-4 key concepts or aspects
3. Include relevant examples
4. End with practical takeaways or next steps

Adjust the depth, vocabulary, and technical detail based on the level:
- Basic: Simple language, everyday analogies, foundational concepts only
- Intermediate: More technical terms, assumes basic knowledge, deeper explanations
- Advanced: Technical language, complex concepts, assumes strong foundation
- Expert: Highly technical, cutting-edge topics, assumes expert background

Format your response in clean HTML with appropriate headings and paragraphs. Use <h3> for section headers and <p> for paragraphs.";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={apiKey}";
            
            var response = await _httpClient.PostAsJsonAsync(url, requestBody);
            var jsonContent = await response.Content.ReadAsStringAsync();
            var responseContent = System.Text.Json.JsonSerializer.Deserialize<GoogleApiResponse>(jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google API error: {Error}", responseContent.Error?.Message);
                return StatusCode((int)response.StatusCode, 
                    new GenerateResponse { Error = responseContent.Error?.Message ?? "API request failed" });
            }

            var content = responseContent.Candidates?[0]?.Content?.Parts?[0]?.Text ?? "No response generated";

            return Ok(new GenerateResponse { Content = content });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating content");
            return StatusCode(500, new GenerateResponse { Error = "Failed to generate content" });
        }
    }
}

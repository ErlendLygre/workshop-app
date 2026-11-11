namespace HomeLibrary.Api.Models;

public class Book
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Author { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset AddedAt { get; set; }
}

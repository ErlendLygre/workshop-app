using HomeLibrary.Api.Data;
using HomeLibrary.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeLibrary.Api.Endpoints;

public record CreateBookRequest(string? Title, string? Author);
public record UpdateBookRequest(bool IsRead);

public static class BookEndpoints
{
    public static void MapBookEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/books").RequireAuthorization();

        group.MapGet("/", async (bool? read, LibraryDbContext db) =>
        {
            var query = db.Books.AsNoTracking();
            if (read is not null)
            {
                query = query.Where(b => b.IsRead == read);
            }
            return await query.OrderBy(b => b.Title).ToListAsync();
        });

        group.MapPost("/", async (CreateBookRequest request, LibraryDbContext db) =>
        {
            var title = request.Title?.Trim() ?? string.Empty;
            var author = string.IsNullOrWhiteSpace(request.Author) ? null : request.Author.Trim();

            var errors = new Dictionary<string, string[]>();
            if (title.Length == 0)
                errors["title"] = ["Title is required."];
            else if (title.Length > LibraryDbContext.TitleMaxLength)
                errors["title"] = [$"Title can be at most {LibraryDbContext.TitleMaxLength} characters."];
            if (author?.Length > LibraryDbContext.AuthorMaxLength)
                errors["author"] = [$"Author can be at most {LibraryDbContext.AuthorMaxLength} characters."];
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            var book = new Book { Title = title, Author = author, AddedAt = DateTimeOffset.UtcNow };
            db.Books.Add(book);
            await db.SaveChangesAsync();
            return Results.Created($"/api/books/{book.Id}", book);
        });

        group.MapPatch("/{id:int}", async (int id, UpdateBookRequest request, LibraryDbContext db) =>
        {
            var book = await db.Books.FindAsync(id);
            if (book is null)
                return Results.NotFound();

            book.IsRead = request.IsRead;
            await db.SaveChangesAsync();
            return Results.Ok(book);
        });

        group.MapDelete("/{id:int}", async (int id, LibraryDbContext db) =>
        {
            var deleted = await db.Books.Where(b => b.Id == id).ExecuteDeleteAsync();
            return deleted == 0 ? Results.NotFound() : Results.NoContent();
        });
    }
}

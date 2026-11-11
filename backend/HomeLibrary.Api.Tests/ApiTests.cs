using System.Net;
using System.Net.Http.Json;
using HomeLibrary.Api.Models;

namespace HomeLibrary.Api.Tests;

public class ApiTests(LibraryApiFactory factory) : IClassFixture<LibraryApiFactory>
{
    private HttpClient NewClient() => factory.CreateClient();

    private async Task<HttpClient> LoggedInClient()
    {
        var client = NewClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { password = LibraryApiFactory.Password });
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        return client;
    }

    [Fact]
    public async Task Health_check_does_not_need_login()
    {
        var response = await NewClient().GetAsync("/healthz");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Books_require_login()
    {
        var client = NewClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/books")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/books", new { title = "x" })).StatusCode);
    }

    [Fact]
    public async Task Wrong_password_is_rejected()
    {
        var response = await NewClient().PostAsJsonAsync("/api/auth/login", new { password = "wrong" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_ends_the_session()
    {
        var client = await LoggedInClient();
        Assert.Equal(HttpStatusCode.NoContent, (await client.GetAsync("/api/auth/me")).StatusCode);
        await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Title_is_required()
    {
        var client = await LoggedInClient();
        var response = await client.PostAsJsonAsync("/api/books", new { title = "  ", author = "Someone" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Add_toggle_filter_and_delete_a_book()
    {
        var client = await LoggedInClient();

        var created = await client.PostAsJsonAsync("/api/books", new { title = " Dune ", author = "Frank Herbert" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var book = await created.Content.ReadFromJsonAsync<Book>();
        Assert.NotNull(book);
        Assert.Equal("Dune", book.Title);
        Assert.False(book.IsRead);

        var unread = await client.GetFromJsonAsync<List<Book>>("/api/books?read=false");
        Assert.Contains(unread!, b => b.Id == book.Id);

        var patched = await client.PatchAsJsonAsync($"/api/books/{book.Id}", new { isRead = true });
        Assert.Equal(HttpStatusCode.OK, patched.StatusCode);

        var read = await client.GetFromJsonAsync<List<Book>>("/api/books?read=true");
        Assert.Contains(read!, b => b.Id == book.Id && b.IsRead);
        unread = await client.GetFromJsonAsync<List<Book>>("/api/books?read=false");
        Assert.DoesNotContain(unread!, b => b.Id == book.Id);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/books/{book.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/books/{book.Id}")).StatusCode);
        var all = await client.GetFromJsonAsync<List<Book>>("/api/books");
        Assert.DoesNotContain(all!, b => b.Id == book.Id);
    }

    [Fact]
    public async Task Unknown_api_route_is_404()
    {
        var client = await LoggedInClient();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/nope")).StatusCode);
    }
}

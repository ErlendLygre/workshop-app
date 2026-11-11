using HomeLibrary.Api.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HomeLibrary.Api.Data;

public class LibraryDbContext(DbContextOptions<LibraryDbContext> options)
    : DbContext(options), IDataProtectionKeyContext
{
    public const int TitleMaxLength = 300;
    public const int AuthorMaxLength = 200;

    public DbSet<Book> Books => Set<Book>();

    // Stores the keys that sign the login cookie, so sessions survive container restarts.
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>(book =>
        {
            book.Property(b => b.Title).HasMaxLength(TitleMaxLength).IsRequired();
            book.Property(b => b.Author).HasMaxLength(AuthorMaxLength);
        });
    }
}

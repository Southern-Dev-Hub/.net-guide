-- roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- nav tabs
CREATE TABLE public.nav_tabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'BookOpen',
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_tabs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_tabs TO authenticated;
GRANT ALL ON public.nav_tabs TO service_role;
ALTER TABLE public.nav_tabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active tabs" ON public.nav_tabs FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage tabs" ON public.nav_tabs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER nav_tabs_updated BEFORE UPDATE ON public.nav_tabs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- learning steps
CREATE TABLE public.learning_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id uuid NOT NULL REFERENCES public.nav_tabs(id) ON DELETE CASCADE,
  step_number int NOT NULL DEFAULT 1,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Beginner',
  estimated_time text NOT NULL DEFAULT '10 min',
  display_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  image_base64 text,
  overview text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  objectives text NOT NULL DEFAULT '',
  commands text NOT NULL DEFAULT '',
  code_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  best_practices text NOT NULL DEFAULT '',
  common_mistakes text NOT NULL DEFAULT '',
  troubleshooting text NOT NULL DEFAULT '',
  step_references text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_steps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_steps TO authenticated;
GRANT ALL ON public.learning_steps TO service_role;
ALTER TABLE public.learning_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published steps" ON public.learning_steps FOR SELECT TO anon, authenticated USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage steps" ON public.learning_steps FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER learning_steps_updated BEFORE UPDATE ON public.learning_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX learning_steps_tab_idx ON public.learning_steps(tab_id, display_order);

-- comments
CREATE TABLE public.step_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES public.learning_steps(id) ON DELETE CASCADE,
  developer_name text NOT NULL,
  role text NOT NULL DEFAULT '',
  avatar_base64 text,
  comment text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.step_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.step_comments TO authenticated;
GRANT ALL ON public.step_comments TO service_role;
ALTER TABLE public.step_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read comments" ON public.step_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage comments" ON public.step_comments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER step_comments_updated BEFORE UPDATE ON public.step_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX step_comments_step_idx ON public.step_comments(step_id);

-- resources
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id uuid REFERENCES public.nav_tabs(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Documentation',
  url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read resources" ON public.resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage resources" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed
INSERT INTO public.nav_tabs (id, title, slug, icon, display_order, is_active) VALUES
('11111111-1111-1111-1111-111111111111','.NET 8 Web API','dotnet-8-web-api','Layers',1,true),
('22222222-2222-2222-2222-222222222222','.NET 10 Web API','dotnet-10-web-api','Rocket',2,true),
('33333333-3333-3333-3333-333333333333','GitHub Integration','github-integration','Github',3,true),
('44444444-4444-4444-4444-444444444444','Additional Resources','additional-resources','BookMarked',4,true);

INSERT INTO public.learning_steps (id, tab_id, step_number, title, subtitle, difficulty, estimated_time, display_order, status, overview, description, objectives, commands, code_blocks, notes, best_practices, common_mistakes, troubleshooting, step_references) VALUES
('aaaaaaa1-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111',1,'Install the .NET 8 SDK','Set up your local development environment','Beginner','10 min',1,'published',
 'Before writing a single line of API code you need the .NET 8 SDK, an editor and a way to verify the install.',
 '<p>The .NET SDK contains the compiler, the runtime and the <code>dotnet</code> CLI. Download the LTS installer for your operating system and confirm that the CLI resolves on your PATH.</p>',
 '<ul><li>Install the .NET 8 SDK</li><li>Verify the CLI works</li><li>List installed runtimes</li></ul>',
 'dotnet --version
dotnet --list-sdks
dotnet --list-runtimes',
 '[{"title":"Verify the installation","language":"bash","code":"dotnet --version\n# 8.0.404\n\ndotnet --list-sdks"}]',
 '<p>On Windows, close and reopen your terminal after installing so PATH changes take effect.</p>',
 '<ul><li>Prefer LTS releases for production APIs</li><li>Pin the SDK version with a global.json file</li></ul>',
 '<ul><li>Installing the runtime only instead of the full SDK</li><li>Mixing preview and LTS SDKs on the same machine</li></ul>',
 '<p>If <code>dotnet</code> is not recognised, add the install folder to your PATH manually.</p>',
 '<ul><li><a href="https://learn.microsoft.com/dotnet/core/install/">Microsoft Learn: install .NET</a></li></ul>'),
('aaaaaaa1-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111',2,'Create the Web API project','Scaffold a minimal API with the dotnet CLI','Beginner','15 min',2,'published',
 'Use the built-in webapi template to generate a working project with Swagger wired up.',
 '<p>The <code>webapi</code> template produces a controller-based or minimal API project. This step scaffolds the solution, adds the project and runs it for the first time.</p>',
 '<ul><li>Create a solution and Web API project</li><li>Understand the generated files</li><li>Run the API locally</li></ul>',
 'dotnet new sln -n LearningApi
dotnet new webapi -n LearningApi.Api
dotnet sln add LearningApi.Api
dotnet run --project LearningApi.Api',
 '[{"title":"Program.cs","language":"csharp","code":"var builder = WebApplication.CreateBuilder(args);\n\nbuilder.Services.AddEndpointsApiExplorer();\nbuilder.Services.AddSwaggerGen();\n\nvar app = builder.Build();\n\nif (app.Environment.IsDevelopment())\n{\n    app.UseSwagger();\n    app.UseSwaggerUI();\n}\n\napp.MapGet(\"/health\", () => Results.Ok(new { status = \"healthy\" }));\n\napp.Run();"},{"title":"Sample controller","language":"csharp","code":"[ApiController]\n[Route(\"api/[controller]\")]\npublic class ProductsController : ControllerBase\n{\n    [HttpGet]\n    public IActionResult GetAll() => Ok(Array.Empty<string>());\n}"}]',
 '<p>Swagger UI is available at <code>/swagger</code> in the Development environment only.</p>',
 '<ul><li>Keep Program.cs thin and move registrations into extension methods</li><li>Use one project per bounded context</li></ul>',
 '<ul><li>Committing launchSettings.json secrets</li><li>Leaving Swagger enabled in production</li></ul>',
 '<p>Port already in use? Change the port in <code>launchSettings.json</code> or pass <code>--urls</code>.</p>',
 '<ul><li><a href="https://learn.microsoft.com/aspnet/core/web-api/">ASP.NET Core Web API docs</a></li></ul>'),
('aaaaaaa1-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111',3,'Add EF Core and a database','Persist data with Entity Framework Core','Intermediate','25 min',3,'published',
 'Wire up Entity Framework Core, create a DbContext and apply your first migration.',
 '<p>EF Core is the default ORM for .NET APIs. You register a <code>DbContext</code> in DI, describe entities with POCO classes and generate SQL migrations from them.</p>',
 '<ul><li>Install the EF Core packages</li><li>Create a DbContext</li><li>Apply the initial migration</li></ul>',
 'dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update',
 '[{"title":"AppDbContext","language":"csharp","code":"public class AppDbContext : DbContext\n{\n    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }\n\n    public DbSet<Product> Products => Set<Product>();\n}"},{"title":"Registration","language":"csharp","code":"builder.Services.AddDbContext<AppDbContext>(options =>\n    options.UseSqlServer(builder.Configuration.GetConnectionString(\"Default\")));"}]',
 '<p>Never store connection strings in source control &mdash; use user secrets locally.</p>',
 '<ul><li>Use async EF Core methods everywhere</li><li>Keep migrations small and reviewed</li></ul>',
 '<ul><li>Calling <code>.Result</code> on async queries</li><li>Running <code>EnsureCreated</code> alongside migrations</li></ul>',
 '<p>Migration errors usually mean the Design package or the EF tool version is out of date.</p>',
 '<ul><li><a href="https://learn.microsoft.com/ef/core/">EF Core documentation</a></li></ul>');

INSERT INTO public.step_comments (step_id, developer_name, role, comment, is_pinned) VALUES
('aaaaaaa1-0000-4000-8000-000000000001','Anna Petrova','Principal Engineer','Pin your SDK with a global.json from day one. It saves the whole team from "works on my machine" build drift.',true),
('aaaaaaa1-0000-4000-8000-000000000001','Marcus Reed','Senior Backend Developer','On CI runners install the SDK with the official setup action instead of a package manager – versions there are usually stale.',false),
('aaaaaaa1-0000-4000-8000-000000000002','Priya Raman','Staff Engineer','Minimal APIs are great, but once you pass ~15 endpoints move to controllers or endpoint groups. Readability wins.',true),
('aaaaaaa1-0000-4000-8000-000000000002','Marcus Reed','Senior Backend Developer','Add a /health endpoint immediately. Every deployment platform expects one.',false),
('aaaaaaa1-0000-4000-8000-000000000003','Anna Petrova','Principal Engineer','Review generated migrations before committing. EF sometimes drops and recreates columns you did not intend to touch.',true);

INSERT INTO public.resources (tab_id, title, type, url, description, display_order) VALUES
('11111111-1111-1111-1111-111111111111','ASP.NET Core Web API','Microsoft Learn','https://learn.microsoft.com/aspnet/core/web-api/','Official guidance for building HTTP APIs with ASP.NET Core.',1),
('11111111-1111-1111-1111-111111111111','EF Core Docs','Documentation','https://learn.microsoft.com/ef/core/','Entity Framework Core reference and tutorials.',2),
('11111111-1111-1111-1111-111111111111','Swashbuckle.AspNetCore','NuGet Package','https://www.nuget.org/packages/Swashbuckle.AspNetCore','Swagger tooling for ASP.NET Core APIs.',3),
('33333333-3333-3333-3333-333333333333','dotnet/aspnetcore','GitHub Repository','https://github.com/dotnet/aspnetcore','Source code for the ASP.NET Core framework.',1);
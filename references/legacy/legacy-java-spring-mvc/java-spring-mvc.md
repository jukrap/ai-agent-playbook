# Java Spring MVC Stack Checks

## Inspect Together

- Controller mappings, request methods, interceptors, servlet filters, JSP fragments, taglibs, tiles/layouts, and included scripts.
- Form objects, binder rules, validators, model attribute names, session attributes, flash attributes, and redirect targets.
- XML and annotation configuration, bean names, component scan ranges, transaction boundaries, scheduler/job beans, and profile-specific properties.
- MyBatis mapper XML, result maps, parameter names, stored procedure calls, generated keys, and SQL fragments shared across screens.

## Change Risks

- A renamed model attribute can break a JSP, validation message, JavaScript snippet, or included fragment without compile-time evidence.
- Controller-level changes can be intercepted by filters, security rules, locale resolvers, multipart config, or session assumptions.
- Transactional service changes can change lazy-loading behavior, mapper call order, or stored procedure side effects.
- WAR/container behavior may differ from local embedded runs because of servlet version, classloader order, JNDI, encoding, or server config.

## Verification

- Exercise GET, POST success, validation failure, authorization/session failure, redirect, and refresh/back-button behavior.
- Verify JSP rendering, form field names, message codes, hidden fields, and JavaScript values emitted by the server.
- Run mapper-level or database evidence for changed SQL, including affected rows, result-map shape, and rollback/repair expectation.
- Check startup or deployment-shaped packaging when beans, XML, filters, profiles, web.xml, or WAR resources changed.
- Pair with `backend/server-rendered-change`, `database/query-performance-review`, or `security/auth-access-control` when the change crosses those boundaries.

import { ContentTransformer } from '@crystallize/reactjs-components';
import { HeadersFunction, json, LoaderFunction, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { CategoryList } from '~/core/components/category-list';
import { FolderHero } from '~/core/components/folder-hero';

import splideStyles from '@splidejs/splide/dist/css/themes/splide-default.min.css';
import { HttpCacheHeaderTaggerFromLoader, StoreFrontAwaretHttpCacheHeaderTagger } from '~/core/Http-Cache-Tagger';
import { getStoreFront } from '~/core/storefront/storefront.server';
import { CrystallizeAPI } from '~/core/use-cases/crystallize';
import { buildMetas } from '~/core/MicrodataBuilder';

export function links() {
    return [{ rel: 'stylesheet', href: splideStyles }];
}

export let meta: MetaFunction = ({ data }) => {
    return buildMetas(data);
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
    return HttpCacheHeaderTaggerFromLoader(loaderHeaders).headers;
};

export const loader: LoaderFunction = async ({ request, params }) => {
    const url = new URL(request.url);
    const preview = url.searchParams.get('preview');
    const version = preview ? 'draft' : 'published';
    const path = '/shop';
    const { shared, secret } = await getStoreFront(request.headers.get('Host')!);
    const [folder, navigation] = await Promise.all([
        CrystallizeAPI.fetchFolder(secret.apiClient, path, version),
        CrystallizeAPI.fetchNavigation(secret.apiClient, path),
    ]);

    return json({ folder, navigation }, StoreFrontAwaretHttpCacheHeaderTagger('15s', '1w', [path], shared.config));
};

export default () => {
    const { folder, navigation } = useLoaderData();
    const hero = folder.components.find((component: any) => component.id === 'hero-content')?.content
        ?.selectedComponent;
    return (
        <>
            <FolderHero component={hero} />
            <div className="2xl lg:container mx-auto px-10">
                <div className="flex flex-wrap gap-4 pt-20 mb-10  items-center">
                    <h2 className="font-medium text-md text-md w-full block">Browse categories</h2>
                    {navigation?.tree?.children?.map((child: any) => (
                        <Link
                            to={child?.path}
                            prefetch="intent"
                            className="w-auto bg-grey py-2 sm:px-6 px-4 rounded-md sm:text-lg text-md font-bold"
                            key={child.name}
                        >
                            {child.name}
                        </Link>
                    ))}
                </div>
                <div>
                    {navigation?.tree?.children?.map((child: any) => (
                        <div className="border-t border-[#dfdfdf] py-20 overflow-hidden" key={child.path}>
                            <div className="flex sm:items-center justify-between sm:flex-row flex-col sm:gap-0 gap-3">
                                <div className="sm:w-2/4 leading-[1.5em] w-full">
                                    <h2 className="font-bold text-2xl mb-3">{child.name}</h2>
                                    <ContentTransformer
                                        className="leading-1"
                                        json={child?.description?.content?.json}
                                    />
                                </div>

                                <Link
                                    to={child?.path}
                                    prefetch="intent"
                                    className="sm:w-auto w-40 bg-grey py-2 sm:px-6 px-4 text-center rounded-md sm:text-md text-sm font-bold hover:bg-black hover:text-white"
                                    key={child.name}
                                >
                                    View all {child.name.toLowerCase()}
                                </Link>
                            </div>
                            <div className="overflow-auto">
                                <CategoryList category={child} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

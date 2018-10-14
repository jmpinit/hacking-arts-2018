module.exports = {
    name: 'client-side',
    mode: 'development',
    entry: './client/src/main.js',
    output: {
        path: __dirname,
        filename: 'client/build/app.js',
    },
    /*module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['@babel/preset-env'],
                },
            },
        ],
    },*/
};

#!/usr/bin/perl

use 5.10.0;
use warnings;
use strict;

my $dir     = "notes";
my $logfile = "index.log";

sub write_file {
    my ($file, $data) = @_;
    open my $out, ">", $file
        or die "Cannot open file '$file' for writing: $!\n";
    print $out $data;
    close $out
        or die "Cannot close file '$file' after writing: $!\n";
}

sub read_file {
    my ($file, $data) = @_;
    open my $in, "<", $file
        or die "Cannot open file '$file' for reading: $!\n";
    return join "", <$in>;
}

sub erase_file {
    my ($file) = @_;
    unlink $file or die "Cannot erase file '$file': $!\n";
}

{
    open my $log, ">>", $logfile;
    sub debug { say $log @_ }
}

################################################################################

my $method = $ENV{REQUEST_METHOD} // "";
my $id     = shift(@ARGV) // "";

if (not $method) {
    die "This is a CGI script, it cannot be run from the command line\n";
}

if (not $id =~ /^[a-z0-9]+$/) {
    die "bad sticky note ID '$id' (must be strictly alphanumerical)\n";
}

my $file = "$dir/$id";
for ($method) {
    /^GET$/ and do {
        my $payload = read_file($file);
        debug "GET $id -- $payload";
        say "Content-Type: application/json\n";
        say $payload;
        exit 0;
    };
    # FIXME: Not tested
    /^DELETE$/ and do {
        debug "DEL $id";
        say "Content-Type: application/json\n";
        erase_file($file);
        exit 0;
    };
    /^PUT$/ and do {
        my $payload = join "", <STDIN>;
        debug "PUT $id -- $payload";
        write_file($file, $payload);
        say "Content-Type: application/JSON\n";
        exit 0;
    }
}

#[eof]
